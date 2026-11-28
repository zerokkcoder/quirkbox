# Third-party data / 第三方資料

## EFF Large Wordlist

- **Upstream file / 原始檔案**: https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt
- **Announcement / 公告**: https://www.eff.org/deeplinks/2016/07/new-wordlists-random-passphrases
- **Original work / 原作者**: Electronic Frontier Foundation, compiled by Joseph Bonneau, © 2016
- **Licence / 授權**: CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/
  (per https://www.eff.org/copyright; a legacy CC BY 3.0 badge is still shown on that page /
  依 eff.org/copyright 的 EFF 原創素材政策；該頁仍掛著舊的 CC BY 3.0 徽章)
- **Retrieved / 取用日期**: 2026-11-27
- **Format / 格式**: 7776 words (6^5), five-dice Diceware usage / 7776 詞（6 的 5 次方），五骰 Diceware 用法
- **Modifications / 修改**: vendored verbatim as a TypeScript constant in
  `src/features/password-generator/lib/wordlist.ts`; the dice-number column was removed.
  以 TypeScript 常數原樣內嵌，僅移除骰號欄位。
- **Used by / 使用處**: `/tools/password-generator` passphrase mode / 口令模式

EFF asks that redistributed material note where it came from, so the links above are
kept intact. "Diceware" is a trademark of Arnold G. Reinhold; the EFF list is EFF's own
wordlist, not Reinhold's original list.
EFF 希望轉散布時註明出處，故保留上述連結。「Diceware」為 Arnold G. Reinhold 的商標；
EFF 詞表是 EFF 自製的替代詞表，不是 Reinhold 原版。
