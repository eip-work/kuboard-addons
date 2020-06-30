#!/bin/bash

echo
echo "install script loaded, start to download kuboard-cli binary."
echo

wget https://dl.kuboard.cn/downloads/kuboard-cli/linux/kuboard-cli.zip.bin

mv ./kuboard-cli.zip.bin ./kuboard-cli.zip

unzip ./kuboard-cli.zip

chmod a+x ./kuboard-cli

rm /usr/local/bin/kuboard-cli || true

mv ./kuboard-cli /usr/local/bin

rm ./kuboard-cli.zip

echo
echo

echo "Congratulations!"
echo "kuboard-cli is installed at /usr/local/bin/kuboard-cli." 
echo "Now, you can use it following the tips in Kuboard UI."
