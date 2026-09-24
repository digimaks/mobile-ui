#!/bin/sh

BASE_PATH="${BASE_PATH:-/}"
BASE_PATH="${BASE_PATH%/}/"

process_file() {
    local file="$1"
    local is_gz="$2"

    if [ "$is_gz" = "true" ]; then
        gunzip -c "$file" | \
        sed -e "s|//BASE_PATH//|${BASE_PATH}|g" \
            -e "s|http://base_path//|${BASE_PATH}|g" \
            -e "s|\"//BASE_PATH//|\"${BASE_PATH}|g" \
            -e "s|'//BASE_PATH//|'${BASE_PATH}|g" \
            -e "s|{{PUBLIC_URL}}|${PUBLIC_URL:-""}|g" \
            -e "s|{{ENVIRONMENT}}|${ENVIRONMENT:-"production"}|g" \
            -e "s|{{SERVICE_URL}}|${SERVICE_URL:-"/api"}|g" \
        gzip > "${file}.tmp" && mv "${file}.tmp" "$file"
    else
        sed -i \
            -e "s|//BASE_PATH//|${BASE_PATH}|g" \
            -e "s|http://base_path//|${BASE_PATH}|g" \
            -e "s|\"//BASE_PATH//|\"${BASE_PATH}|g" \
            -e "s|'//BASE_PATH//|'${BASE_PATH}|g" \
            -e "s|{{PUBLIC_URL}}|${PUBLIC_URL:-""}|g" \
            -e "s|{{ENVIRONMENT}}|${ENVIRONMENT:-"production"}|g" \
            -e "s|{{SERVICE_URL}}|${SERVICE_URL:-"/api"}|g" \
            "$file"
    fi
}

find /usr/share/nginx/html -type f | while read -r file; do
    case "$file" in
        *.gz) process_file "$file" "true" ;;
        *) process_file "$file" "false" ;;
    esac
done
