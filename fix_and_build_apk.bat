@echo off
rmdir /s /q "C:\Users\Administrator\.gradle\wrapper\dists\gradle-8.12-all"
cd my_flutter_app
C:\flutter\bin\flutter build apk --verbose
pause