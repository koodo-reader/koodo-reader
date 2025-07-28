@echo off
cd my_flutter_app
C:\flutter\bin\flutter build apk --verbose > ..\direct_build_log.txt 2>&1
if %errorlevel% equ 0 (
echo Build completed. Check direct_build_log.txt for details.
) else (
echo Build failed. Check direct_build_log.txt for details.
)
pause