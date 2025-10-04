# 🚀 DID Management - Deployment Guide

## Overview
This guide will help you deploy your MERN stack DID Management application online using free services.

## 📋 Prerequisites
- GitHub account
- Git installed on your machine
- Terminal/Command line access

## 🌐 Deployment Strategy

### **Option 1: Vercel (Frontend) + Railway (Backend) - RECOMMENDED**

#### **Step 1: Prepare Your Repository**

1. **Initialize Git Repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - DID Management App"
   ```

2. **Create GitHub Repository**:
   - Go to [GitHub](https://github.com) and create a new repository named "did-management"
   - Don't initialize with README (since you already have files)

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/yourusername/did-management.git
   git branch -M main
   git push -u origin main
   ```

#### **Step 2: Deploy Backend to Railway**

1. **Sign up for Railway**:
   - Go to [Railway.app](https://railway.app)
   - Sign up with your GitHub account

2. **Deploy Backend**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `did-management` repository
   - Railway will auto-detect it's a Node.js project
   - Set the **Root Directory** to `backend`
   - Add environment variables:
     ```
     NODE_ENV=production
     PORT=3001
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_super_secret_key_here
     ```

3. **Get your Backend URL**:
   - Once deployed, Railway will give you a URL like: `https://your-app.railway.app`

#### **Step 3: Deploy Frontend to Vercel**

1. **Update Frontend API URL**:
   - In your frontend, create a `.env.production` file:
     ```
     REACT_APP_API_URL=https://your-backend-url.railway.app
     ```

2. **Sign up for Vercel**:
   - Go to [Vercel.com](https://vercel.com)
   - Sign up with your GitHub account

3. **Deploy Frontend**:
   - Click "New Project"
   - Import your GitHub repository
   - Set **Root Directory** to `frontend`
   - Vercel will auto-detect it's a React app
   - Click "Deploy"

#### **Step 4: Configure CORS**

Update your backend to allow your frontend domain:
- In Railway, add environment variable:
  ```
  CORS_ORIGIN=https://your-frontend-domain.vercel.app
  ```

### **Option 2: Full Stack on Render (Alternative)**

1. **Sign up for Render**:
   - Go to [Render.com](https://render.com)
   - Sign up with GitHub

2. **Deploy Backend**:
   - Create "New Web Service"
   - Connect GitHub repository
   - Set **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - Add environment variables

3. **Deploy Frontend**:
   - Create "New Static Site"
   - Connect same GitHub repository
   - Set **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

### **Option 3: Full Stack on Heroku**

1. **Install Heroku CLI**
2. **Create Heroku Apps**:
   ```bash
   heroku create your-app-backend
   heroku create your-app-frontend
   ```
3. **Deploy with Git subtree**:
   ```bash
   git subtree push --prefix backend heroku-backend main
   git subtree push --prefix frontend heroku-frontend main
   ```

## 🗄️ Database Setup

### **MongoDB Atlas (FREE)**

1. **Sign up for MongoDB Atlas**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create free account

2. **Create Cluster**:
   - Choose "Shared" (free tier)
   - Select region closest to you
   - Create cluster

3. **Setup Database Access**:
   - Go to "Database Access"
   - Add new database user
   - Create username/password

4. **Setup Network Access**:
   - Go to "Network Access"
   - Add IP Address: `0.0.0.0/0` (allow from anywhere)

5. **Get Connection String**:
   - Go to "Clusters" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

## 🔧 Environment Variables

### Backend (.env):
```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dids-analytics
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

### Frontend (.env.production):
```
REACT_APP_API_URL=https://your-backend-domain.railway.app
```

## ✅ Post-Deployment Checklist

- [ ] Backend API is accessible at your Railway/Render URL
- [ ] Frontend loads without errors
- [ ] API calls from frontend to backend work
- [ ] Database connection is successful
- [ ] File uploads work (if using file storage service)
- [ ] All environment variables are set correctly

## 🐛 Common Issues & Solutions

### CORS Errors:
- Ensure `CORS_ORIGIN` in backend matches your frontend URL exactly
- Check that both HTTP and HTTPS versions are handled

### API Connection Issues:
- Verify `REACT_APP_API_URL` is correct
- Check if backend is running and accessible
- Ensure API endpoints return expected data

### Database Connection:
- Verify MongoDB Atlas allows connections from 0.0.0.0/0
- Check username/password in connection string
- Ensure database name matches your app

## 📱 Custom Domain (Optional)

### Vercel:
1. Go to your project settings
2. Add custom domain
3. Update DNS records as instructed

### Railway:
1. Go to your service settings
2. Add custom domain
3. Update DNS records

## 💰 Cost Estimates

- **Vercel**: Free tier (sufficient for most small apps)
- **Railway**: $5/month after free tier usage
- **Render**: Free tier available, paid plans from $7/month
- **MongoDB Atlas**: Free tier (512MB storage)
- **Custom Domain**: $10-15/year

## 🔄 Continuous Deployment

Once set up, any push to your main branch will automatically trigger deployments:
- Vercel: Auto-deploys on push to main
- Railway: Auto-deploys on push to main
- Render: Auto-deploys on push to main

Your app will be live at:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-app.railway.app

Happy deploying! 🎉