# Configure Microsoft Entra ID Integration

> **Time:** ~15 minutes | **Difficulty:** Advanced

This guide explains how to configure a Microsoft Entra ID (Azure AD) App Registration to grant Harmony OP the "God-Mode" permissions required to provision users, assign licenses, and manage groups.

## Prerequisites
- [ ] Global Administrator access to your Microsoft 365 / Azure tenant.
- [ ] Harmony OP running locally or deployed.
- [ ] Access to the Harmony OP Settings Dashboard.

## Steps

### 1. Register the Application
Create the foundational identity for Harmony OP in your tenant.
1. Go to the [Microsoft Entra admin center](https://entra.microsoft.com/).
2. Navigate to **Identity** > **Applications** > **App registrations**.
3. Click **New registration**.
4. Name it `Harmony OP Provisioning Engine`.
5. Under **Supported account types**, select `Accounts in this organizational directory only (Single tenant)`.
6. Click **Register**.

✅ Expected: You are redirected to the App Overview page. Note down the **Application (client) ID** and **Directory (tenant) ID**.

### 2. Generate a Client Secret
Create the secure password Harmony OP will use to authenticate.
1. In your App Registration menu, go to **Certificates & secrets**.
2. Click **New client secret**.
3. Description: `Production Secret` (or `Local Dev`). Expiry: `24 months`.
4. Click **Add**.

✅ Expected: A new secret is generated.
⚠️ **Warning:** Copy the **Value** immediately. It will be hidden once you leave the page.

### 3. Assign API Permissions
Grant the exact Graph API permissions required for automated provisioning.
1. In your App Registration menu, go to **API permissions**.
2. Click **Add a permission** > **Microsoft Graph** > **Application permissions** (not Delegated).
3. Search for and select the following permissions:
   - `User.ReadWrite.All` (To create users and reset passwords)
   - `Directory.ReadWrite.All` (To manage domain data)
   - `GroupMember.ReadWrite.All` (To add users to security groups)
4. Click **Add permissions**.

### 4. Grant Admin Consent
Permissions are useless until explicitly approved by a Global Admin.
1. On the API permissions page, click the **Grant admin consent for [Your Tenant Name]** button located above the permissions list.
2. Confirm the prompt.

✅ Expected: The "Status" column for all permissions should now show a green checkmark indicating "Granted".

### 5. Configure Harmony OP
Inject the credentials into your Harmony OP environment.
1. Log in to Harmony OP as an Administrator.
2. Navigate to **Settings** > **Integrations**.
3. Input the **Tenant ID**, **Client ID**, and **Client Secret** gathered in the previous steps.
4. Save the configuration.

## Verify It Works
1. Submit a test Hire Request in Harmony OP.
2. Approve the request.
3. Check the Microsoft Entra ID Users list to confirm the new account was physically created.

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `401 Unauthorized` | Invalid Client Secret or Tenant ID. | Generate a new Client Secret and update Harmony OP. |
| `403 Forbidden` | Missing Admin Consent for API permissions. | Return to Step 4 and ensure the green checkmarks are present. |
| License assignment fails | The tenant does not have enough available licenses. | Purchase additional licenses in the M365 Admin Center. |