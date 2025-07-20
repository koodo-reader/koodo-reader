@echo off
cd my_flutter_app
C:\flutter\bin\flutter build apk --verbose > flutter_build_detailed.log 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Build completed, log saved to flutter_build_detailed.log
    dir build\app\outputs\flutter-apk /b
) else (
    echo Build failed, log saved to flutter_build_detailed.log
)
pause