# Social media handover

Updated 13 October 2026. Ardy authorized restructuring the connected Google Drive handover. The operational entry point is [Konten Social Media](https://drive.google.com/drive/folders/111Q9IOs4sa3MjswKtJX8JXL9dIyz7gNf), inside Parenteers → 16 Personalities.

## Manager workflow

1. Open Feed or Story and its Daftar Posting spreadsheet.
2. Choose a row and click its named material link.
3. Upload all JPGs from that folder in numbered order.
4. Feed: copy Caption and Hashtag. Story: the sequence text is already on the JPGs; apply the link/question sticker instructions from Catatan.
5. Check Sudah diposting? after the content is live. Prior publication was not evidenced in the source, so initial checkboxes are unchecked and the sheet explicitly asks the manager to check historical posting before uploading.

## Structure and deliverables

```text
Konten Social Media/
  Feed/
    Daftar Posting Feed (Google Sheets; one tab)
    Materi/01 - Judul Konten/01.jpg, 02.jpg, ...
  Story/
    Daftar Posting Story (Google Sheets; one tab)
    Materi/01 - Judul Story/01.jpg, 02.jpg, ...
```

- [Feed spreadsheet](https://docs.google.com/spreadsheets/d/1ZVtJYwzAc4yCVUjqyTJ2zbz0gk7vmMoFCSAlj8GOUWY/edit): 40 entries, 188 images. Rows 1–24 are the existing static campaign sets; rows 25–40 are the existing single personality cards, explicitly marked as alternatives outside the main sequence.
- [Story spreadsheet](https://docs.google.com/spreadsheets/d/17ciAAkw7S12fRbb-Ak1Lf1JgeYBmXJw9rsXJdJ-0B0Q/edit): 58 entries, 142 images. Rows 1–42 are the existing three-frame sequences; rows 43–58 are the existing single personality cards, marked as alternatives.
- Both spreadsheets have one tab, Daftar Posting, and six columns: Nomor, Link desain/folder, Caption, Hashtag, Sudah diposting?, Catatan. Native clickable text links and BOOLEAN checkboxes, filter on the complete populated table, four frozen opening/header rows, wrapped text, timezone Asia/Makassar. Google Sheets locale remains its supported existing en_US default. No frozen columns cross the two merged opening rows.
- Material folders use two-digit numbers and human theme names. Every image is named 01.jpg, 02.jpg, etc. The original 66 sequence folder IDs and all 330 image IDs were preserved.
- Team owner/writer permissions inherited from the project folder were verified on both new spreadsheets. No public sharing was added.

## Content source and boundaries

Feed captions come from caption.txt accompanying the actual final uploaded image sets. Trailing hashtags were separated into their own column without rewriting the caption body. Single-card captions reuse the corresponding personality caption. Story sequence text and CTA come from each final set's copy.json; notes retain manual sticker instructions.

R02 is the approved Parenteers brand demo. The older strategy workbook still describes a Christine-result version with placeholders, so it must not override the production caption or Story frames. Existing static adaptations of planned Reels are labeled as image carousels. F01/Z01 notes retain Christine's wording review before publication. No new experience, result, testimonial, post date or historical posted status was invented.

[Arsip Materi dan Panduan](https://drive.google.com/drive/folders/1IIDVUE8RU-NDwt-fzNgrb0icCT6VO2oP) is a sibling outside the manager handover folder. It retains 144 Feed support files, 168 Story support files, the four original strategy/content spreadsheets, and the previous container structure. Support filenames include their new set name to avoid collisions. File contents were not rewritten. Archived HTML previews may retain original relative paths; use the preserved local production package for previewing.

## Verification and recovery

Evidence: outputs/social-media-handover-2026-10-13/ contains source-snapshot.json, before-metadata.json, handover-plan.json, mutation-plan.json, native-readback.json and verification.json.

- Exact equality checked across all 98 live rows for caption, hashtags, notes, numbering and hyperlinks; all 98 checkboxes have native BOOLEAN validation and initially false values.
- Complete live folder readback confirmed 40 Feed and 58 Story material folders and exactly 330 numbered JPGs. All image IDs, byte sizes and source count/order were preserved. Connector metadata does not expose remote checksums; no remote hash verification is claimed.
- The handover root contains only Feed/Story; each contains its own spreadsheet and Materi. The project root contains the handover and separate archive.
- Both local workbook layouts were rendered and inspected. Native Google Sheets values, formatting, controls, filter, grid structure and permissions were read back through the connector; native browser screenshot acceptance was not performed.
- To restore, use before-metadata.json for original file/folder names and parents and source-snapshot.json for original inventories. All assets and source documents still exist under their original Drive IDs. Never run a blanket restore after the manager starts updating checkboxes; preserve subsequent live work.

This task reorganized the handover only. Scheduling/publication, a launch date, Christine review and Instagram compression/device review remain separate work.
