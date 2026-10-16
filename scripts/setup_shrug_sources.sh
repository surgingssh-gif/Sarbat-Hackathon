#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/.." && pwd)"
source_dir="${repo_root}/data/raw/reference/shrug/antyodaya_2020"

verify_and_extract() {
    local filename="$1"
    local expected_checksum="$2"
    local destination="$3"
    local archive_path="${source_dir}/${filename}"
    local actual_checksum

    if [[ ! -f "${archive_path}" ]]; then
        echo "Missing ${archive_path}" >&2
        echo "Download the pinned SHRUG v2.2 CSV archive and retry." >&2
        exit 1
    fi

    actual_checksum="$(shasum -a 256 "${archive_path}" | awk '{print $1}')"
    if [[ "${actual_checksum}" != "${expected_checksum}" ]]; then
        echo "Checksum mismatch for ${filename}" >&2
        echo "Expected: ${expected_checksum}" >&2
        echo "Actual:   ${actual_checksum}" >&2
        exit 1
    fi

    mkdir -p "${source_dir}/${destination}"
    unzip -oq "${archive_path}" -d "${source_dir}/${destination}"
    echo "Verified and extracted ${filename}"
}

verify_and_extract \
    "shrug-antyodaya-csv.zip" \
    "0d8a44ef774b2703e4f4a6f1f4e636179c4b3d81d57cae828b3e1411ac498bd3" \
    "antyodaya"

verify_and_extract \
    "shrug-pc-keys-csv.zip" \
    "e2d606c990d92ba8cedf207d2859162bcadde83a38917553bf23c83c1f5d660e" \
    "pc_keys"

verify_and_extract \
    "shrug-shrid-keys-csv.zip" \
    "ea50f74dc8a62b9e983821cab6851db5aa535f83838905f375f2ede4687d8fd4" \
    "shrid_keys"

required_files=(
    "antyodaya/antyodaya_shrid.csv"
    "pc_keys/pc11r_shrid_key.csv"
    "shrid_keys/shrid_loc_names.csv"
    "shrid_keys/shrid2_spatial_stats.csv"
)

for relative_path in "${required_files[@]}"; do
    if [[ ! -f "${source_dir}/${relative_path}" ]]; then
        echo "Expected extracted file is missing: ${relative_path}" >&2
        exit 1
    fi
done

echo "SHRUG sources are ready under ${source_dir}"
echo "Run: .venv/bin/dbt build --profiles-dir ."
