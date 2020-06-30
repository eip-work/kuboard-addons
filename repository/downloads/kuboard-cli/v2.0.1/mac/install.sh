#!/bin/bash

function _do()
{
  "$@" || { alert "exec failed: ""$@"; exit -1; }
}

echo
echo "install script loaded, start to download kuboard-cli binary."
echo

_do wget https://dl.kuboard.cn/downloads/kuboard-cli/mac/kuboard-cli.zip.bin

_do mv ./kuboard-cli.zip.bin ./kuboard-cli.zip

_do unzip ./kuboard-cli.zip

_do chmod a+x ./kuboard-cli

rm /usr/local/bin/kuboard-cli || true

_do mv ./kuboard-cli /usr/local/bin

rm ./kuboard-cli.zip

echo
echo

echo "Congratulations!"
echo "kuboard-cli is installed at /usr/local/bin/kuboard-cli." 
echo "Now, you can use it following the tips in Kuboard UI."
