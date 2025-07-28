@echo off
REM 设置Flutter路径
goto :start

:start
set FLUTTER_PATH=C:\flutter\bin
set PATH=%FLUTTER_PATH%;%PATH%

REM 检查Flutter是否可用
where flutter
if %errorlevel% neq 0 (
echo Flutter未找到，请检查路径是否正确: %FLUTTER_PATH%
pause
exit /b 1
)

REM 显示Flutter版本
flutter --version

REM 进入Flutter项目目录
cd my_flutter_app

REM 构建APK
flutter build apk --verbose

REM 检查构建结果
if %errorlevel% equ 0 (
echo APK构建成功！
dir build\app\outputs\flutter-apk
) else (
echo APK构建失败！
)

pause