@echo off

curl -O https://dl.kuboard.cn/downloads/kuboard-cli/v2.0.1/windows/kuboard-cli.exe

move kuboard-cli.exe "%USERPROFILE%\AppData\Local\Microsoft\WindowsApps\kuboard-cli.exe"

echo Congratulations!
echo kuboard-cli is installed at %USERPROFILE%\AppData\Local\Microsoft\WindowsApps\kuboard-cli.exe.
echo Now, you can use it following the tips in Kuboard UI.
