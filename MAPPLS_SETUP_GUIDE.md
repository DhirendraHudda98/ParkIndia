# 🗺️ Mappls Fresh Setup Guide

## Diagnostic Results ✅

**Issue Identified**: The current Mappls API key is **invalid or expired**
- Atlas API test returned: **401 Unauthorized**
- Backend API status: 500 (likely not running, but not the main issue)
- SDK URL format: ✅ Correct

---

## Step 1: Get a Fresh Mappls API Key

### 1.1 Sign Up / Log In to Mappls Console
1. Go to **[https://www.mappls.com/console/](https://www.mappls.com/console/)**
2. Sign in with your Mappls account (or create one if needed)
3. Once logged in, you'll see the **Mappls Dashboard**

### 1.2 Create a New REST API Key
1. In the left sidebar, go to **API Keys** or **Keys Management**
2. Click **+ Create a New API Key** or **+ Add Key**
3. Configure the key:
   - **Name**: `parkhub-production` (or `parkhub-dev` for testing)
   - **Key Type**: Select **REST API**
   - **API Services** (enable these):
     - ✅ **Maps Display SDK** (for MapView.jsx)
     - ✅ **Atlas** (for LocationSearch.jsx - address autocomplete)
     - ✅ **Nearby** (optional, for proximity search)
   - **Domain Restriction**: Add your domains:
     - `localhost` (for local development)
     - `127.0.0.1` (for local IP)
     - Your production domain (e.g., `parkingapp.com`)
   - **Description**: "ParkHub - Indian Parking Management"

4. Click **Generate** or **Create**
5. Copy the generated **API Key** (36-character string)
   - It looks like: `zlklltapnzznxixyyfrreihtquszytswceuy`

---

## Step 2: Update Frontend Configuration

### 2.1 Update `.env` File
Edit `/parkhub-web/.env`:

```bash
# Replace the old key with your new one
VITE_MAPPLS_API_KEY=YOUR_NEW_KEY_HERE
```

**Example:**
```env
VITE_MAPPLS_API_KEY=abc123def456ghi789jkl012mno345pqr
VITE_APP_NAME=ParkIndia
VITE_DEFAULT_CITY=Mumbai
VITE_DEFAULT_LAT=19.0760
VITE_DEFAULT_LNG=72.8777
VITE_CURRENCY=INR
VITE_CURRENCY_SYMBOL=₹
VITE_AVAILABILITY_REFRESH_SECONDS=30
VITE_API_URL=http://127.0.0.1:8000
```

### 2.2 Update Backend Configuration (Optional)
If you're using environment variables on the backend, also update:

**`.env` (Laravel backend):**
```env
MAPPLS_API_KEY=YOUR_NEW_KEY_HERE
```

Or in **`docker-compose.india.yml`**:
```yaml
environment:
  MAPPLS_API_KEY: "YOUR_NEW_KEY_HERE"
```

---

## Step 3: Verify the Integration

### 3.1 Test with Diagnostic Script
The diagnostic script was created at `scripts/test-mappls-setup.mjs`. Run it:

```bash
cd parkhub-php
node scripts/test-mappls-setup.mjs
```

**Expected Output:**
- ✅ API Key configured
- ✅ Backend API is responding
- ✅ SDK URL is properly formatted
- ✅ Atlas API is responding

### 3.2 Test Frontend Map Loading
1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open the app in browser: `http://localhost:3000` or `http://localhost:5173`
3. Navigate to the **Map** page
4. You should see:
   - ✅ Map loads without errors
   - ✅ Parking lot markers appear
   - ✅ Marker popups show (name, address, availability, rate)
   - ✅ Address search works (LocationSearch component)

### 3.3 Test Address Search
1. In the map page, locate the **Location Search** input
2. Type "Mumbai" or any Indian city/landmark
3. You should see suggestions appear:
   - Places in India
   - With address details
   - Clickable to select

### 3.4 Browser Console Check
1. Open **Developer Tools** (F12 → Console)
2. Look for any Mappls-related errors:
   ```javascript
   // ✅ Good:
   // No errors related to Mappls
   
   // ❌ Bad (indicates problems):
   // "Failed to load Mappls SDK script"
   // "Mappls SDK timeout"
   // "Could not fetch suggestions"
   ```

---

## Step 4: Data Flow & Troubleshooting

### Data Sent to Map
The map displays parking lots with this data:

```json
{
  "id": 1,
  "name": "Central Parking Lot",
  "address": "123 Main Street, Mumbai",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "available_spots": 45,
  "total_slots": 100,
  "hourly_rate_inr": 50,
  "daily_max_inr": 300,
  "status": "open",
  "color": "green"
}
```

**API Endpoint**: `/api/availability?city=Mumbai`

### Common Issues & Solutions

#### Issue 1: "Failed to load Mappls SDK script"
**Cause**: API key is invalid/expired
**Solution**: Follow Steps 1-2 above to generate a fresh key

#### Issue 2: "Could not fetch suggestions" (in address search)
**Cause**: Atlas API authorization failed
**Solution**: 
- Verify API key has **Atlas** service enabled
- Check domain restrictions don't block localhost
- Verify `VITE_MAPPLS_API_KEY` is set correctly

#### Issue 3: Markers not showing on map
**Cause**: Backend API not running or returning wrong data
**Solution**:
```bash
# Start Laravel backend
php artisan serve
# or
npm run php

# Check API response
curl http://127.0.0.1:8000/api/availability
```

#### Issue 4: Map loads but no parking lots visible
**Cause**: No parking data or API key expires during session
**Solution**:
- Check `/api/availability` returns data
- Verify center coordinates are correct: [19.0760, 72.8777]
- Check backend database has parking lot records

---

## Step 5: Production Deployment

### For Docker
Update in `docker-compose.india.yml`:
```yaml
environment:
  MAPPLS_API_KEY: "${MAPPLS_API_KEY:-your_key_here}"
```

Then run:
```bash
MAPPLS_API_KEY=your_new_key docker-compose -f docker-compose.india.yml up
```

### For Traditional Hosting
1. Set environment variable on server:
   ```bash
   export MAPPLS_API_KEY=your_new_key
   ```
2. Or add to `.env`:
   ```
   MAPPLS_API_KEY=your_new_key
   ```
3. Add domain to Mappls API key restrictions

---

## Reference: Mappls Integration Details

### Files Using Mappls
- `parkhub-web/src/views/MapView.jsx` - Main map display
- `parkhub-web/src/components/LocationSearch.jsx` - Address search
- `parkhub-web/.env` - Configuration
- `config/parkindia.php` - Laravel config

### SDK URLs Used
```javascript
// Map SDK
https://apis.mappls.com/advancedmaps/v1/{API_KEY}/map_load?v=1.5&plugins=all

// Address Search API
https://atlas.mappls.com/api/places/textsearch/json?query={QUERY}&region=IND
Authorization: bearer {API_KEY}
```

### Environment Variables
```env
# Frontend (parkhub-web/.env)
VITE_MAPPLS_API_KEY=xxxxx
VITE_API_URL=http://127.0.0.1:8000

# Backend (root .env) - Optional
MAPPLS_API_KEY=xxxxx
```

---

## Support & Resources

- **Mappls Console**: https://www.mappls.com/console/
- **Mappls Documentation**: https://mappls.com/api/
- **Maps SDK Docs**: https://mappls.com/advancedmaps/
- **Atlas Search Docs**: https://mappls.com/api/places/textsearch/

---

✅ **You're all set!** Once you've completed Steps 1-2, your map should work perfectly.
