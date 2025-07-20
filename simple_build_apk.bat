@echo off
set FLUTTER_PATH=C:\flutter\bin
set PATH=%FLUTTER_PATH%;%PATH%

echo === Build started at %date% %time% === > flutter_build_log.txt

echo Checking Flutter installation... >> flutter_build_log.txt 2>&1
where flutter >> flutter_build_log.txt 2>&1
if %errorlevel% neq 0 (
echo [ERROR] Flutter not found. Check path: %FLUTTER_PATH% >> flutter_build_log.txt 2>&1
echo Flutter not found. Check path: %FLUTTER_PATH%
pause
exit /b 1
)

echo Flutter version info: >> flutter_build_log.txt 2>&1
flutter --version >> flutter_build_log.txt 2>&1

echo Changing to my_flutter_app directory... >> flutter_build_log.txt 2>&1
cd my_flutter_app
if %errorlevel% neq 0 (
echo [ERROR] Failed to enter my_flutter_app directory. Error code: %errorlevel% >> ..\flutter_build_log.txt 2>&1
echo Failed to enter my_flutter_app directory.
pause
exit /b 1
)

echo Current directory: %cd% >> ..\flutter_build_log.txt 2>&1
echo Starting Flutter build... >> ..\flutter_build_log.txt 2>&1
flutter build apk >> ..\flutter_build_log.txt 2>&1
set BUILD_ERRORLEVEL=%errorlevel%

echo Flutter build exited with code: %BUILD_ERRORLEVEL% >> ..\flutter_build_log.txt 2>&1
if %BUILD_ERRORLEVEL% equ 0 (
echo [SUCCESS] Build successful! >> ..\flutter_build_log.txt
echo Checking build output directory... >> ..\flutter_build_log.txt
dir build\app\outputs\flutter-apk >> ..\flutter_build_log.txt 2>&1
echo Build successful! Check flutter_build_log.txt for details.
) else (
echo [ERROR] Build failed with error code: %BUILD_ERRORLEVEL% >> ..\flutter_build_log.txt
echo Build failed! Check flutter_build_log.txt for details.
)

echo === Build completed at %date% %time% === >> ..\flutter_build_log.txt
pause