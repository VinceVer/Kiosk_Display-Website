@echo off
echo Sending shutdown request to the server...
curl http://localhost/shutdown
echo Terminating email service...
pm2 delete index
echo Done.
pause