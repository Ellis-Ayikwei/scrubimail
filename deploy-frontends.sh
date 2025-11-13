#!/bin/bash

#####################################################################
# ScrubiMail - Complete Deployment Commands
# Frontend & Admin Frontend Build & Deployment
#####################################################################

set -e  # Exit on any error

echo "======================================================================"
echo "ScrubiMail Deployment Script"
echo "======================================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

#####################################################################
# USER FRONTEND (Scrubimail-FE)
#####################################################################

echo -e "${BLUE}======================================================================"
echo "1. Building User Frontend (Scrubimail-FE)"
echo -e "======================================================================${NC}"
echo ""

cd /workspaces/scrubimail/Scrubimail-FE

echo -e "${YELLOW}→ Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}→ Running type check...${NC}"
npm run type-check || echo -e "${RED}Warning: Type check failed${NC}"

echo -e "${YELLOW}→ Building production bundle...${NC}"
npm run build

echo -e "${GREEN}✓ User Frontend build complete!${NC}"
echo -e "  Build output: ${PWD}/dist"
echo ""

#####################################################################
# ADMIN FRONTEND (Scrubimail-Admin-FE)
#####################################################################

echo -e "${BLUE}======================================================================"
echo "2. Building Admin Frontend (Scrubimail-Admin-FE)"
echo -e "======================================================================${NC}"
echo ""

cd /workspaces/scrubimail/Scrubimail-Admin-FE

echo -e "${YELLOW}→ Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}→ Running type check...${NC}"
npm run type-check || echo -e "${RED}Warning: Type check failed${NC}"

echo -e "${YELLOW}→ Building production bundle...${NC}"
npm run build

echo -e "${GREEN}✓ Admin Frontend build complete!${NC}"
echo -e "  Build output: ${PWD}/dist"
echo ""

#####################################################################
# DEPLOYMENT SUMMARY
#####################################################################

echo -e "${BLUE}======================================================================"
echo "Deployment Summary"
echo -e "======================================================================${NC}"
echo ""

echo -e "${GREEN}✓ User Frontend:${NC}"
echo -e "  Location: /workspaces/scrubimail/Scrubimail-FE/dist"
echo -e "  Deploy to: Vercel, Netlify, or static hosting"
echo ""

echo -e "${GREEN}✓ Admin Frontend:${NC}"
echo -e "  Location: /workspaces/scrubimail/Scrubimail-Admin-FE/dist"
echo -e "  Deploy to: Vercel, Netlify, or static hosting"
echo ""

echo -e "${YELLOW}📝 Next Steps:${NC}"
echo ""
echo "  For Vercel deployment:"
echo -e "    ${BLUE}cd Scrubimail-FE && vercel --prod${NC}"
echo -e "    ${BLUE}cd Scrubimail-Admin-FE && vercel --prod${NC}"
echo ""
echo "  For Netlify deployment:"
echo -e "    ${BLUE}cd Scrubimail-FE && netlify deploy --prod --dir=dist${NC}"
echo -e "    ${BLUE}cd Scrubimail-Admin-FE && netlify deploy --prod --dir=dist${NC}"
echo ""
echo "  For static hosting (nginx, Apache):"
echo -e "    ${BLUE}rsync -avz Scrubimail-FE/dist/ user@server:/var/www/scrubimail/${NC}"
echo -e "    ${BLUE}rsync -avz Scrubimail-Admin-FE/dist/ user@server:/var/www/admin.scrubimail/${NC}"
echo ""

echo -e "${GREEN}======================================================================"
echo "Build Complete! 🚀"
echo -e "======================================================================${NC}"
