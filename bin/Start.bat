@echo off

cd ..

cd .database
call npm install
start /B pm2 start index.js --restart-delay 30000
cd ..

cd .website
call npm install

npm run start