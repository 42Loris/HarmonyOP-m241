/**
 * lib/infrastructure/microsoft-graph.ts
 * 
 * Infrastructure Adapter for Microsoft Graph API.
 * Follows DDD principles by abstracting raw HTTP/Infrastructure details 
 * away from the Application Layer (Server Actions).
 */

export interface MicrosoftIntegration {
  tenantId: string | null;
  clientId: string | null;
  clientSecret: string | null;
}

export interface MSGraphUser {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mailNickname: string;
  mail?: string | null;
}

export interface MSGraphGroup {
  id: string;
  displayName: string;
  mailNickname?: string;
}

export interface MSGraphSku {
  skuId: string;
  skuPartNumber: string;
}

export class MicrosoftGraphService {
  private tenantId: string;
  private clientId: string;
  private clientSecret: string;
  private baseUrl = "https://graph.microsoft.com/v1.0";

  constructor(integration: MicrosoftIntegration) {
    if (!integration.tenantId || !integration.clientId || !integration.clientSecret) {
      throw new Error("Microsoft Integration credentials are incomplete.");
    }
    this.tenantId = integration.tenantId;
    this.clientId = integration.clientId;
    this.clientSecret = integration.clientSecret;
  }

  /**
   * Internal helper to fetch an OAuth2 Access Token using client_credentials.
   */
  private async getAccessToken(): Promise<string> {
    const res = await fetch(`https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId,
        scope: "https://graph.microsoft.com/.default",
        client_secret: this.clientSecret,
        grant_type: "client_credentials",
      }),
    });

    const data = await res.json();
    if (!data.access_token) {
      throw new Error("Failed to authenticate with Microsoft Graph API.");
    }
    return data.access_token;
  }

  private async getHeaders() {
    const token = await this.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Fetches the default domain for the tenant.
   */
  async getDefaultDomain(): Promise<string> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/domains`, { headers });
    const data = await res.json();
    return data.value?.find((d: { isDefault: boolean, id: string }) => d.isDefault)?.id || "company.com";
  }

  /**
   * Fetches available Subscribed SKUs (Licenses).
   */
  async getSubscribedSkus(): Promise<MSGraphSku[]> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/subscribedSkus`, { headers });
    const data = await res.json();
    return data.value || [];
  }

  /**
   * Fetches all Entra Groups.
   */
  async getGroups(select = "id,displayName"): Promise<MSGraphGroup[]> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/groups?$select=${select}`, { headers });
    const data = await res.json();
    return data.value || [];
  }

  /**
   * Creates a new user in Entra ID.
   */
  async createUser(payload: {
    displayName: string;
    mailNickname: string;
    userPrincipalName: string;
    tempPassword: string;
    usageLocation?: string;
  }): Promise<MSGraphUser> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        accountEnabled: true,
        displayName: payload.displayName,
        mailNickname: payload.mailNickname,
        userPrincipalName: payload.userPrincipalName,
        usageLocation: payload.usageLocation || "CH",
        passwordProfile: {
          forceChangePasswordNextSignIn: true,
          password: payload.tempPassword,
        },
      }),
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(`Microsoft Graph User Creation Failed: ${data.error.message}`);
    }
    return data;
  }

  /**
   * Patches an existing user.
   */
  async patchUser(userIdOrEmail: string, data: Record<string, unknown>): Promise<void> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/users/${userIdOrEmail}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Microsoft Graph Patch Failed: ${err.error?.message || res.statusText}`);
    }
  }

  /**
   * Assigns licenses to a user.
   */
  async assignLicenses(userId: string, skuIds: string[]): Promise<void> {
    if (skuIds.length === 0) return;
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/users/${userId}/assignLicense`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        addLicenses: skuIds.map((skuId) => ({ skuId })),
        removeLicenses: [],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Microsoft Graph License Assignment Failed: ${err.error?.message || res.statusText}`);
    }
  }

  /**
   * Adds a user to a security group.
   */
  async addUserToGroup(groupId: string, userId: string): Promise<void> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/groups/${groupId}/members/$ref`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        "@odata.id": `https://graph.microsoft.com/v1.0/directoryObjects/${userId}`,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Microsoft Graph Group Assignment Failed: ${err.error?.message || res.statusText}`);
    }
  }

  /**
   * Disables a user account.
   */
  async disableUser(userIdOrEmail: string): Promise<void> {
    await this.patchUser(userIdOrEmail, { accountEnabled: false });
  }

  /**
   * Revokes active sessions for a user.
   */
  async revokeSessions(userIdOrEmail: string): Promise<void> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/users/${userIdOrEmail}/revokeSignInSessions`, {
      method: "POST",
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Microsoft Graph Session Revocation Failed: ${err.error?.message || res.statusText}`);
    }
  }

  /**
   * Resets a user's password.
   */
  async resetPassword(email: string, tempPassword: string): Promise<void> {
    await this.patchUser(email, {
      passwordProfile: {
        forceChangePasswordNextSignIn: true,
        password: tempPassword,
      },
    });
  }

  /**
   * Searches for a group by display name.
   */
  async findGroupByDisplayName(displayName: string): Promise<MSGraphGroup | null> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/groups?$filter=displayName eq '${displayName}'`, { headers });
    const data = await res.json();
    return data.value?.[0] || null;
  }

  /**
   * Creates a security group.
   */
  async createSecurityGroup(payload: {
    displayName: string;
    mailNickname: string;
    description: string;
  }): Promise<MSGraphGroup> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/groups`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        description: payload.description,
        displayName: payload.displayName,
        groupTypes: [],
        mailEnabled: false,
        mailNickname: payload.mailNickname,
        securityEnabled: true,
      }),
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(`Microsoft Graph Group Creation Failed: ${data.error.message}`);
    }
    return data;
  }

  /**
   * Fetches a user by ID or Email.
   */
  async getUser(userIdOrEmail: string): Promise<MSGraphUser> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/users/${userIdOrEmail}`, { headers });
    const data = await res.json();
    if (data.error) {
      throw new Error(`Microsoft Graph User Fetch Failed: ${data.error.message}`);
    }
    return data;
  }
}