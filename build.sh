#!/bin/bash
datetime=`date +%Y%m%d-%H%M%S`
echo $datetime
tag=eipwork/kuboard-addons

docker build -t $tag:latest .


if test $datetime != ""; then
  # docker push $tag:latest
  docker tag $tag:latest $tag:$datetime
  docker push $tag:$datetime
fi
