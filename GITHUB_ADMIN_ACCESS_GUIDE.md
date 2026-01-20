# How to Give Admin Access on GitHub

## Scenario 1: You Own the Repository

If you created the repository, you should already have admin access. If you don't see the Settings tab:

1. **Check if you're logged in** to the correct GitHub account
2. **Verify the repository URL** matches your account
3. **Try accessing directly**: https://github.com/hwy99signs/Resolute-Plan/settings

## Scenario 2: Repository Belongs to an Organization

If the repository belongs to an organization (`hwy99signs`), you need organization owner permissions:

### For Organization Owners (to give you access):

1. Go to the organization: https://github.com/hwy99signs
2. Click **Settings** (organization settings, not repo settings)
3. Go to **People** (left sidebar)
4. Find your username or add yourself
5. Change your role to **Owner** or give you **Admin** access to the specific repository

### For Repository Admins (to give someone else access):

1. Go to the repository: https://github.com/hwy99signs/Resolute-Plan
2. Click **Settings** tab
3. Go to **Collaborators and teams** (left sidebar)
4. Click **Add people** or **Invite a collaborator**
5. Enter the GitHub username or email
6. Select permission level: **Admin** (full access including settings)
7. Click **Add [username] to this repository**

## Scenario 3: Repository Belongs to Someone Else

If someone else owns the repository, ask them to:

1. Go to: https://github.com/hwy99signs/Resolute-Plan/settings
2. Click **Collaborators and teams** (left sidebar)
3. Click **Add people**
4. Enter your GitHub username
5. Select **Admin** permission
6. Click **Add [username] to this repository**

## Quick Check: Do You Have Access?

Try accessing these URLs:

1. **Repository main page**: https://github.com/hwy99signs/Resolute-Plan
   - ✅ If you can see this, you have at least read access

2. **Settings page**: https://github.com/hwy99signs/Resolute-Plan/settings
   - ✅ If you can see this, you have admin access
   - ❌ If you get 404, you need admin permissions

3. **Collaborators page**: https://github.com/hwy99signs/Resolute-Plan/settings/access
   - ✅ If you can see this, you have admin access

## Alternative: Use Netlify Drop (No Admin Needed!)

If you can't get admin access, use Netlify Drop instead - it's faster and doesn't require GitHub admin access:

1. Go to: https://app.netlify.com/drop
2. Drag and drop `privacy-policy.html`
3. Get instant URL
4. Use in Google Play Console

This takes 30 seconds and doesn't require any GitHub permissions!

## If You're the Owner But Still Can't Access Settings

1. **Clear browser cache** and cookies for github.com
2. **Try incognito/private mode**
3. **Check if you're logged into the correct account**
4. **Verify the repository exists**: https://github.com/hwy99signs/Resolute-Plan

## Need to Transfer Repository Ownership?

If you need to transfer the repository to your account:

1. Go to repository **Settings**
2. Scroll to **Danger Zone**
3. Click **Transfer ownership**
4. Enter new owner username
5. Type repository name to confirm
6. Click **I understand, transfer this repository**

**Note:** Only repository owners can transfer ownership.
