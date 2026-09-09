#!/bin/sh
set -eu

security_options=$(docker info --format '{{json .SecurityOptions}}')
case "$security_options" in
  *name=rootless*) ;;
  *)
    echo 'This development container requires rootless Docker. Select the rootless Docker context.' >&2
    exit 1
    ;;
esac
