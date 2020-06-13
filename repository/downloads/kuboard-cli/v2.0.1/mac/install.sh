#!/bin/bash

function _do()
{
  "$@" || { alert "exec failed: ""$@"; exit -1; }
}

echo
echo "install script loaded, start to download kuboard-cli binary."
echo

_do curl -O https://addons.kuboard.cn/downloads/kuboard-cli/v2.0.1/mac/kuboard-cli

_do chmod a+x ./kuboard-cli

rm /usr/local/bin/kuboard-cli || true

_do mv ./kuboard-cli /usr/local/bin

echo "kuboard-cli installed at /usr/local/bin/kuboard-cli. Now, you can use it following the tips in Kuboard UI."
