# 🗄️ Database Setup Guide for DID Management

## Current Status
Your app is currently using **mock data** - that's why you don't see any collections in MongoDB Atlas yet. This guide will help you connect to your real database.

## 📋 Prerequisites
- ✅ MongoDB Atlas account (you have this)
- ✅ Database cluster created (you have this)
- ✅ Database user created

## 🔧 Step-by-Step Database Connection

### Step 1: Get Your MongoDB Connection String

1. **In MongoDB Atlas Dashboard:**
   - Click **"Connect"** on your cluster
   - Choose **"Connect your application"**
   - Select **"Node.js"** driver
   - Copy the connection string (looks like):
   ```
   mongodb+srv://username:<password>@cluster.mongodb.net/database-name
   ```

2. **Replace placeholders:**
   - Replace `<password>` with your database user password
   - Replace `database-name` with `dids-analytics`
   
   **Example:**
   ```
   mongodb+srv://admin:mypassword123@cluster0.abc123.mongodb.net/dids-analytics
   ```

### Step 2: Configure Vercel Environment Variables

1. **Go to Vercel Dashboard:**
   - Open your `y2k-did-management` project
   - Go to **Settings** → **Environment Variables**

2. **Add these variables:**
   ```
   Name: MONGODB_URI
   Value: mongodb+srv://your-username:your-password@cluster.mongodb.net/dids-analytics
   
   Name: NODE_ENV
   Value: production
   ```

3. **Save and redeploy** your application

### Step 3: Enable Database Connection in Code

Your API functions are already prepared to use MongoDB. Once you add the `MONGODB_URI` environment variable, the app will:

1. **Automatically connect** to your MongoDB Atlas database
2. **Create collections** if they don't exist:
   - `dids` - Store DID records
   - `companies` - Store company information
   - `areacodes` - Store area code data
3. **Seed initial data** with sample records

### Step 4: Verify Database Connection

After setting up the environment variables and redeploying:

1. **Visit your app** at `https://y2k-did-management.vercel.app`
2. **Navigate to different pages** (DIDs, Companies, Area Codes)
3. **Check MongoDB Atlas** - you should now see:
   - Database: `dids-analytics`
   - Collections: `dids`, `companies`, `areacodes`
   - Sample data in each collection

## 📊 Expected Database Structure

### DIDs Collection
```json
{
  "_id": "ObjectId",
  "didNumber": "+12125551001",
  "provider": "Verizon",
  "status": "active",
  "assignedTo": "Y2K Group IT",
  "areaCode": "212",
  "state": "NY",
  "city": "New York",
  "notes": "Primary business line",
  "dateAssigned": "2024-01-15",
  "monthlyRate": 2.50,
  "createdAt": "2024-10-04T...",
  "updatedAt": "2024-10-04T..."
}
```

### Companies Collection
```json
{
  "_id": "ObjectId",
  "companyId": "COMP001",
  "companyName": "Y2K Group IT",
  "description": "Technology Solutions Provider",
  "contactEmail": "admin@y2kgrouphosting.com",
  "contactPhone": "+12125551001",
  "address": "123 Tech Street, New York, NY 10001",
  "status": "active",
  "didCount": 15,
  "createdAt": "2024-01-01",
  "updatedAt": "2024-10-04T..."
}
```

### Area Codes Collection
```json
{
  "_id": "ObjectId",
  "areaCode": "212",
  "state": "NY",
  "city": "New York",
  "didCount": 150,
  "availableCount": 25,
  "createdAt": "2024-10-04T...",
  "updatedAt": "2024-10-04T..."
}
```

## 🔐 Security Best Practices

1. **Network Access:**
   - In MongoDB Atlas → Network Access
   - Add IP: `0.0.0.0/0` (allow from anywhere)
   - This is needed for Vercel serverless functions

2. **Database User:**
   - Use a strong password
   - Grant "Read and write to any database" permissions

3. **Environment Variables:**
   - Never commit connection strings to git
   - Use Vercel environment variables only

## 🧪 Testing Database Connection

After setup, test these features:

1. **Add a new DID** - should appear in MongoDB
2. **Edit company info** - changes should save to database
3. **Delete records** - should remove from MongoDB
4. **View data** - should load from real database, not mock data

## 🆘 Troubleshooting

### Issue: Still seeing mock data
- **Solution:** Check if `MONGODB_URI` environment variable is set correctly in Vercel

### Issue: Connection timeouts
- **Solution:** Verify network access allows `0.0.0.0/0` in MongoDB Atlas

### Issue: Authentication failed
- **Solution:** Double-check username, password, and database name in connection string

### Issue: Collections not created
- **Solution:** Make API calls (visit pages in your app) to trigger collection creation

## 🎯 Next Steps

Once database is connected:
1. **Import existing data** via CSV upload feature
2. **Set up automated backups** in MongoDB Atlas
3. **Monitor usage** in Atlas dashboard
4. **Scale cluster** if needed (currently free tier is sufficient)

Your app will automatically switch from mock data to real database once the MongoDB connection is established! 🚀