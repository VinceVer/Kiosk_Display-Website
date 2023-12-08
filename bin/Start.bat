@echo off

cd ..
cd .database
start /B pm2 start index.js --restart-delay 30000
cd ..

cd .website
npm run start