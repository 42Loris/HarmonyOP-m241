import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MicrosoftGraphService } from '../lib/infrastructure/microsoft-graph';

describe('MicrosoftGraphService', () => {
  const mockIntegration = {
    tenantId: 'fake-tenant-id',
    clientId: 'fake-client-id',
    clientSecret: 'fake-client-secret'
  };

  let graphService: MicrosoftGraphService;
  
  beforeEach(() => {
    graphService = new MicrosoftGraphService(mockIntegration);
    
    // Mock the global fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw an error if credentials are incomplete', () => {
    expect(() => new MicrosoftGraphService({ tenantId: 'fake', clientId: null, clientSecret: 'fake' }))
      .toThrow('Microsoft Integration credentials are incomplete.');
  });

  describe('Authentication', () => {
    it('should fetch an access token and use it in subsequent requests', async () => {
      // Mock the token response
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'mock-access-token' }),
      } as Response);
      
      // Mock the actual domain request response
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ value: [{ isDefault: true, id: 'test.com' }] }),
      } as Response);

      const domain = await graphService.getDefaultDomain();

      expect(domain).toBe('test.com');
      
      // Verify the token request was made correctly
      expect(global.fetch).toHaveBeenNthCalledWith(1, `https://login.microsoftonline.com/fake-tenant-id/oauth2/v2.0/token`, expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: expect.any(URLSearchParams)
      }));

      // Verify the auth header was passed to the domain request
      expect(global.fetch).toHaveBeenNthCalledWith(2, `https://graph.microsoft.com/v1.0/domains`, expect.objectContaining({
        headers: {
          Authorization: 'Bearer mock-access-token',
          'Content-Type': 'application/json'
        }
      }));
    });
  });

  describe('createUser', () => {
    it('should correctly format the payload to create a new user', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'mock-access-token' }),
      } as Response);
      
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-user-id', displayName: 'John Doe' }),
      } as Response);

      const payload = {
        displayName: 'John Doe',
        mailNickname: 'jdoe',
        userPrincipalName: 'jdoe@test.com',
        tempPassword: 'temp-password'
      };

      const result = await graphService.createUser(payload);

      expect(result.id).toBe('new-user-id');
      expect(global.fetch).toHaveBeenNthCalledWith(2, `https://graph.microsoft.com/v1.0/users`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer mock-access-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountEnabled: true,
          displayName: 'John Doe',
          mailNickname: 'jdoe',
          userPrincipalName: 'jdoe@test.com',
          usageLocation: 'CH',
          passwordProfile: {
            forceChangePasswordNextSignIn: true,
            password: 'temp-password'
          }
        })
      });
    });

    it('should throw an error if user creation fails', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'mock-access-token' }),
      } as Response);
      
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: { message: 'Invalid password policy' } }),
      } as Response);

      await expect(graphService.createUser({
        displayName: 'John Doe',
        mailNickname: 'jdoe',
        userPrincipalName: 'jdoe@test.com',
        tempPassword: '123'
      })).rejects.toThrow('Microsoft Graph User Creation Failed: Invalid password policy');
    });
  });

  describe('assignLicenses', () => {
    it('should not make a request if skuIds array is empty', async () => {
      await graphService.assignLicenses('user-id', []);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should correctly format the payload to assign licenses', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'mock-access-token' }),
      } as Response);
      
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await graphService.assignLicenses('user-id', ['sku-1', 'sku-2']);

      expect(global.fetch).toHaveBeenNthCalledWith(2, `https://graph.microsoft.com/v1.0/users/user-id/assignLicense`, expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          addLicenses: [{ skuId: 'sku-1' }, { skuId: 'sku-2' }],
          removeLicenses: []
        })
      }));
    });
  });
});