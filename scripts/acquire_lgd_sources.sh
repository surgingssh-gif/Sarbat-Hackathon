#!/usr/bin/env bash
set -euo pipefail

lgd_release_tag="lgd-latest-extra1"
lgd_repository="ramSeraph/opendata"
lgd_snapshot="15Oct2026"
lgd_raw_root="${1:-data/raw/reference/lgd/2026-10-15}"
lgd_archive_dir="${lgd_raw_root}/archive"
lgd_extract_dir="${lgd_raw_root}/extracted"

mkdir -p "${lgd_archive_dir}" "${lgd_extract_dir}"

gh release download "${lgd_release_tag}" \
  --repo "${lgd_repository}" \
  --dir "${lgd_archive_dir}" \
  --skip-existing \
  --pattern "states.${lgd_snapshot}.csv.7z" \
  --pattern "districts.${lgd_snapshot}.csv.7z" \
  --pattern "subdistricts.${lgd_snapshot}.csv.7z" \
  --pattern "villages.${lgd_snapshot}.csv.7z" \
  --pattern "villages_by_blocks.${lgd_snapshot}.csv.7z"

verify_checksum() {
  local expected_checksum="$1"
  local archive_path="$2"
  local actual_checksum
  actual_checksum="$(shasum -a 256 "${archive_path}" | awk '{print $1}')"
  if [[ "${actual_checksum}" != "${expected_checksum}" ]]; then
    echo "Checksum mismatch: ${archive_path}" >&2
    exit 1
  fi
}

verify_checksum "3aa6be54fca51ca5e541de50691b520a90f8fd16d0b026b85314b165ff19b685" "${lgd_archive_dir}/states.${lgd_snapshot}.csv.7z"
verify_checksum "2bcb1749872f4f266812d8c33e027845a24ddbba760d259296f2a8610ed5dc08" "${lgd_archive_dir}/districts.${lgd_snapshot}.csv.7z"
verify_checksum "b01ec1965a8b34745b6d1e849b663fb32c814eed089ac77ac6340b9b7549aeb5" "${lgd_archive_dir}/subdistricts.${lgd_snapshot}.csv.7z"
verify_checksum "eea068ee6ab4c37b7c2b3b535b0cf7da3729c29dfac312aca3524fbfd8a64176" "${lgd_archive_dir}/villages.${lgd_snapshot}.csv.7z"
verify_checksum "c66884d34bb5baded72a2ef7d6d3627892b7633906b99df7df3bf866b4ea0698" "${lgd_archive_dir}/villages_by_blocks.${lgd_snapshot}.csv.7z"

for archive_path in "${lgd_archive_dir}"/*.7z; do
  bsdtar -xf "${archive_path}" -C "${lgd_extract_dir}"
done

echo "LGD snapshot acquired and verified at ${lgd_raw_root}"
