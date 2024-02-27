#!/bin/bash

set -e

BROWSER_DIR=`dirname $(realpath $0)` && cd $BROWSER_DIR

function download_chromium {

    # Set defaults
    arch="x64"
    os="linux"
    chromium_version="112"
    chromium_binary="chrome"
    ARCHTYPE=`uname -m`
    force=$1

    # Architecture
    if [ "$ARCHTYPE" = "aarch64" ] || [ "$ARCHTYPE" = "arm64" ]; then
        arch="arm64"
    fi

    # Platform
    if (echo "$OSTYPE" | grep -qi darwin); then
        os="mac"
        chromium_binary="Chromium.app/Contents/MacOS/Chromium"
    elif [ "$OSTYPE" = "msys" ] || [ "$OSTYPE" = "cygwin" ] || [ "$OSTYPE" = "win32" ]; then
        os="win"
        chromium_binary="chrome.exe"
        BROWSER_DIR=`pwd -W`
    fi

    # Variables
    artifact="chromium-$os-$arch.zip"
    chromium_url="https://ci.opensearch.org/ci/dbc/tools/chromium/$chromium_version/zip/$artifact"
    chromium_path="$BROWSER_DIR/chromium/chrome-$os/$chromium_binary"

    # Get artifact
    if [ "$force" = "true" ] || [ ! -f "$chromium_path" ]; then
        rm -rf chromium
        mkdir -p chromium
        cd chromium
        curl -sSLO $chromium_url
        unzip -qq $artifact
        rm $artifact
    fi

    echo "$chromium_path chromium-$chromium_version os-$os arch-$arch"

    # Verify binary
    if [ "$os" = "win" ]; then
        powershell -command "(Get-Item $chromium_path)".VersionInfo
    else
        $chromium_path --version
    fi
}
