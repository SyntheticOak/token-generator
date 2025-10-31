# Fixing R2 CORS Issues

Your R2 public URL (`pub-016da068b1e34227b3596a4fcb68d6fd.r2.dev`) is not returning CORS headers. Here are the solutions:

## Quick Decision Guide

- **If your domain uses Wix nameservers** (or other services that require their own nameservers): Use **Solution 2** (Bucket CORS Policy) ⬇️
- **If your domain uses Cloudflare nameservers and is on Pro plan or higher**: Use **Solution 1** (Transform Rules) ⬇️
- **If your domain uses Cloudflare nameservers and you want a custom domain**: Use **Solution 3** (Custom Domain) ⬇️

## Solution 1: Cloudflare Transform Rules

**⚠️ Note**: This only works if your domain uses **Cloudflare nameservers**. If your domain uses Wix nameservers or another service's nameservers, use **Solution 2** instead.

### Detailed Step-by-Step Guide

#### Step 1: Access Cloudflare Dashboard
1. Open your web browser and navigate to [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2. **What you'll see**: If not already logged in, you'll see the Cloudflare login page
3. Enter your Cloudflare email and password, then click **"Log in"**
4. **After login**: You'll see the Cloudflare Dashboard with a list of all your domains/accounts

#### Step 2: Select the Correct Account/Domain
1. **What you'll see**: The main dashboard showing your account overview
2. **Important**: You need to find the account that contains your R2 bucket. This might be:
   - A domain you own (like `syntheticoak.com`) that's connected to Cloudflare
   - OR your main Cloudflare account (if R2 was created at the account level)
3. **Look for**: 
   - If you see a domain list, look for any domain you've added to Cloudflare
   - If you don't see domains, look for the **"Workers & Pages"** or **"R2"** option in the left sidebar
4. **Click on**: Either:
   - The domain name in the domain list, OR
   - **"Workers & Pages"** in the left sidebar, then **"R2"** to access R2 buckets directly

#### Step 3: Navigate to Transform Rules
**Option A: If you clicked on a domain:**
1. **What you'll see**: The domain overview page with various tabs and sections
2. **In the left sidebar**, you'll see navigation items like:
   - Overview
   - Analytics
   - SSL/TLS
   - **Rules** (this is what you need!)
   - Speed
   - Caching
   - Network
   - etc.
3. **Click on "Rules"** in the left sidebar
4. **What you'll see**: A submenu will appear under "Rules" with options:
   - Page Rules
   - Transform Rules ← **Click this**
   - Configuration Rules
   - Rate Limiting Rules
   - etc.
5. **Click on "Transform Rules"**

**Option B: If you accessed R2 directly:**
1. **Note**: Transform Rules are applied at the domain/zone level, not at the R2 bucket level
2. You'll need to go back and select a domain that's connected to Cloudflare
3. If you don't have a domain, see **Solution 3** (Custom Domain) below

#### Step 4: Access Modify Response Header Rules
1. **What you'll see**: The Transform Rules page with tabs or sections:
   - **HTTP Request Header Modification** (for incoming requests)
   - **HTTP Response Header Modification** ← **Click this tab/section**
   - URL Rewrite Rules
   - etc.
2. **Click on "HTTP Response Header Modification"** or **"Modify Response Header"**
3. **What you'll see**: 
   - A list of existing rules (if any), and
   - A blue **"Create rule"** or **"Add rule"** button at the top right

#### Step 5: Create the CORS Rule
1. **Click the "Create rule"** or **"Add rule"** button
2. **What you'll see**: A form/dialog with several sections:
   - **Rule name** (text input at the top)
   - **When incoming requests match** (a condition builder)
   - **Then modify response header** (action configuration)

#### Step 6: Configure Rule Name
1. **Find the "Rule name"** field (usually at the top of the form)
2. **Type**: `Add CORS to R2`
3. **What you'll see**: The name appears in the input field

#### Step 7: Configure the Request Matching Condition
1. **Find the section**: **"When incoming requests match"** or **"If"** or **"Matching"**
2. **What you'll see**: This might be:
   - A dropdown menu with options like "Hostname", "URL", etc., OR
   - A text field where you can type a condition expression, OR
   - A visual builder with dropdowns and input fields

**Option A: If you see a visual builder:**
   - **Field dropdown**: Select **"Hostname"** or **"Host header"**
   - **Operator dropdown**: Select **"equals"** or **"is equal to"**
   - **Value input**: Type `pub-016da068b1e34227b3596a4fcb68d6fd.r2.dev`
   - The interface should show something like: `Hostname equals pub-016da068b1e34227b3596a4fcb68d6fd.r2.dev`

**Option B: If you see a text field or "Expression" field:**
   - **Type or paste**: `(http.host eq "pub-016da068b1e34227b3596a4fcb68d6fd.r2.dev")`
   - **What you'll see**: The expression appears in the field
   - Some interfaces show a preview like: "Matches requests where host equals pub-016da068b1e34227b3596a4fcb68d6fd.r2.dev"

#### Step 8: Configure Response Header Modifications
1. **Find the section**: **"Then modify response header"** or **"Action"** or **"Modify"**
2. **What you'll see**: A section with options to add/modify headers, often with:
   - A **"Add header"** or **"Set header"** button, OR
   - Multiple rows/entries for headers

**Add the first header (Access-Control-Allow-Origin):**
   - **Click "Add header"** or **"Set static"** (depending on the interface)
   - **Header name field**: Type `Access-Control-Allow-Origin`
   - **Header value field**: Type `*`
   - **What you'll see**: A row/entry showing `Access-Control-Allow-Origin: *`

**Add the second header (Access-Control-Allow-Methods):**
   - **Click "Add header"** again (or if there's a "+" icon, click it)
   - **Header name field**: Type `Access-Control-Allow-Methods`
   - **Header value field**: Type `GET, HEAD, OPTIONS`
   - **What you'll see**: Another row showing `Access-Control-Allow-Methods: GET, HEAD, OPTIONS`

**Add the third header (Access-Control-Allow-Headers):**
   - **Click "Add header"** again
   - **Header name field**: Type `Access-Control-Allow-Headers`
   - **Header value field**: Type `*`
   - **What you'll see**: A third row showing `Access-Control-Allow-Headers: *`

**Final appearance should show:**
   - `Access-Control-Allow-Origin: *`
   - `Access-Control-Allow-Methods: GET, HEAD, OPTIONS`
   - `Access-Control-Allow-Headers: *`

#### Step 9: Save and Deploy the Rule
1. **Scroll to the bottom** of the form/dialog (if it's long)
2. **What you'll see**: Action buttons like:
   - **"Save"**, **"Deploy"**, **"Save and Deploy"**, or **"Create rule"**
   - Possibly a **"Cancel"** button
3. **Click "Deploy"** or **"Save and Deploy"** or **"Create rule"** (the primary action button)
4. **What you'll see**: 
   - The page may refresh or show a success message
   - You'll be taken back to the Transform Rules list
   - Your new rule **"Add CORS to R2"** should appear in the list with a status indicator (usually green, showing "Active" or "Enabled")

#### Step 10: Verify the Rule is Active
1. **What you'll see**: The Transform Rules page showing your rule in a table/list
2. **Look for**:
   - Rule name: **"Add CORS to R2"**
   - Status: **"Active"**, **"Enabled"**, or a green checkmark
   - Condition: Something like `hostname equals pub-016da068b1e34227b3596a4fcb68d6fd.r2.dev`
   - Action: Something like "Modify response headers" or listing the 3 headers
3. **If you see the rule listed as Active**: The rule is now live and will add CORS headers to responses from your R2 public domain

#### What to Expect After Deployment
- **Changes are usually instant** (Cloudflare propagates quickly)
- You may see a brief loading indicator while the rule deploys
- If there's an error, you'll see a red error message - common issues:
  - Invalid condition syntax (double-check the hostname)
  - Missing required fields (make sure all headers are added)
  - Permission issues (you may need account admin access)

#### Troubleshooting
- **Can't find "Transform Rules"**: You might need to upgrade your Cloudflare plan or the domain must be on a plan that supports Transform Rules (available on Pro plan and above)
- **Can't see the domain**: Make sure the domain is added to your Cloudflare account and active
- **Rule not working**: Wait 1-2 minutes for propagation, then test with the verification command below

## Solution 2: Bucket CORS Policy (Recommended for Wix/Hosted Domains)

**✅ Best option if your domain uses Wix nameservers or other services that require their own nameservers.**

This solution works at the R2 bucket level and doesn't require Cloudflare nameservers or custom domains. It's the simplest solution when you can't change nameservers.

1. Go to **R2** → Your bucket (`token-generator-assets`)
2. Go to **Settings** → **CORS Policy**
3. Ensure this JSON is set:
   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": [],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
4. **Save** and wait 5-10 minutes for propagation

## Solution 3: Custom Domain (Best Long-term, but Requires Cloudflare Nameservers)

**⚠️ Note**: This **requires** your domain to use **Cloudflare nameservers**. If your domain uses Wix nameservers (which can't be changed), this solution **will not work** - use **Solution 2** instead.

**Important**: Use a **different subdomain** than your app domain. If your app runs on `app.syntheticoak.com`, use something like:
- `assets.syntheticoak.com` (recommended)
- `cdn.syntheticoak.com`
- `static.syntheticoak.com`

**Do NOT use** `app.syntheticoak.com` as that's your application domain.

### Prerequisites for Custom Domain

Before adding a custom domain to R2, you **must** have:
1. The parent domain (e.g., `syntheticoak.com`) added to your Cloudflare account
2. The domain must be **proxied** (orange cloud) in Cloudflare, not DNS-only (gray cloud)

### Step-by-Step Setup

#### Step 1: Verify Domain is in Cloudflare
1. Go to Cloudflare Dashboard → **Select your domain** (`syntheticoak.com`)
2. **What you'll see**: The domain overview page
3. **Check**: Make sure the domain status shows as **"Active"** (green)
4. **Important**: If you don't have the parent domain in Cloudflare, you cannot use custom domains for R2

#### Step 2: Ensure Domain is Proxied (Not DNS-Only)
1. In your domain dashboard, go to **DNS** → **Records**
2. **What you'll see**: A list of DNS records
3. **Check the proxy status** (the cloud icon next to records):
   - **Orange cloud** = Proxied (✅ Good - this is required)
   - **Gray cloud** = DNS-only (❌ Won't work - need to enable proxy)
4. **If gray cloud**: Click the cloud icon to change it to orange (proxied)

#### Step 3: Fix "Zone is Not Valid" Error

**If you get "zone is not valid" error when adding custom domain:**

**Option A: The parent domain is not in Cloudflare**
1. Add `syntheticoak.com` to Cloudflare first:
   - Cloudflare Dashboard → **Add a Site**
   - Enter `syntheticoak.com`
   - Follow the setup wizard to add DNS records
   - Change nameservers at your registrar if needed

**Option B: The subdomain doesn't exist yet**
1. Go to **DNS** → **Records** in your domain dashboard
2. Click **"Add record"**
3. **Type**: CNAME (or A record if needed)
4. **Name**: `assets` (this creates `assets.syntheticoak.com`)
5. **Target**: Can be temporary like `1.1.1.1` (we'll update this later)
6. **Proxy status**: Make sure it's **orange cloud** (proxied)
7. **Save** the record
8. Wait 1-2 minutes for DNS propagation
9. Try adding the custom domain to R2 again

**Option C: Domain is DNS-only instead of Proxied**
1. Make sure the parent domain's nameservers point to Cloudflare
2. Ensure all relevant DNS records are proxied (orange cloud)

#### Step 4: Add Custom Domain to R2
1. Go to **R2** → Your bucket (`token-generator-assets`)
2. Click **Settings** tab
3. Scroll to **"Custom Domains"** section
4. Click **"Connect Domain"** or **"Add Custom Domain"**
5. **Enter**: `assets.syntheticoak.com` (or your chosen subdomain)
6. **What you'll see**: 
   - If successful: DNS configuration instructions appear
   - If error: You'll see "zone is not valid" - follow troubleshooting above

#### Step 5: Configure DNS for R2 Custom Domain
1. **After successfully adding the domain**, Cloudflare will show DNS setup instructions
2. Go to **DNS** → **Records** in your domain dashboard
3. Find or create the CNAME record for your subdomain (e.g., `assets`)
4. **Update the record**:
   - **Type**: CNAME
   - **Name**: `assets` (for `assets.syntheticoak.com`)
   - **Target**: The target provided by R2 (usually something like `pub-xxxxx.r2.dev` or a specific R2 endpoint)
   - **Proxy status**: **Orange cloud** (proxied)
5. **Save** and wait 5-10 minutes for DNS propagation

#### Step 6: Configure CORS and Update Environment
1. Configure CORS in the bucket settings (use Solution 2 above)
2. Update `R2_PUBLIC_URL` in `.env` to use the custom domain:
   ```
   R2_PUBLIC_URL=https://assets.syntheticoak.com
   ```
3. Custom domains respect bucket CORS policies better than public R2 URLs

### Common Issues and Solutions

**"Zone is not valid" Error:**
- ✅ Make sure `syntheticoak.com` is added to Cloudflare (not just DNS records)
- ✅ Ensure the domain is **Active** in Cloudflare
- ✅ Check that nameservers point to Cloudflare (not just DNS records)
- ✅ Try creating a CNAME record for the subdomain first, then add to R2

**Custom domain not working after setup:**
- Wait 10-15 minutes for full DNS propagation
- Verify the CNAME target is correct (check R2 custom domain settings)
- Ensure the CNAME record is **proxied** (orange cloud)
- Test with: `curl -I https://assets.syntheticoak.com/assets/portraits/portrait_01.jpg`

**If you can't add the parent domain to Cloudflare:**
- Use **Solution 2** (Bucket CORS) - it works without custom domains and doesn't require Cloudflare nameservers

**If your domain uses Wix nameservers (or similar):**
- **Solution 1** won't work (needs Cloudflare nameservers)
- **Solution 3** won't work (needs Cloudflare nameservers)
- **Use Solution 2** - it's the only option that works when you can't change nameservers

## Verification

After applying any solution, test with:
```bash
curl -H "Origin: https://app.syntheticoak.com" -I https://pub-016da068b1e34227b3596a4fcb68d6fd.r2.dev/assets/portraits/portrait_01.jpg
```

You should see `Access-Control-Allow-Origin` in the response headers.


