# Add Bosses from Sheet Image to nightreign.json

When I run this command, I will attach (or have already attached) an image of a table/sheet showing boss combat stats (damage resistances and status effect thresholds).

Do the following:

1. **Read the schema** from `_data/nightreign.json`: each entry is an object with `name`, `nightlord`, `night`, and damage/status fields. Match this exact structure.

2. **Parse the image** as a boss table:
   - **Columns**: Standard, Slash, Strike, Pierce, Magic, Fire, Lightning, Holy (damage %), then Poison, Rot, Bleed, Frostbite, Sleep, Madness (status buildup or immune).
   - **Damage cells**: Positive % = vulnerability (e.g. `20`), negative % = resistance (e.g. `-10`), empty or “-” = `null`.
   - **Status cells**: Number = buildup threshold (e.g. `154`, `252`); “-” or immune = `null`.
   - **Rows**: The first data row is usually the **NIGHTLORD** (`night: "NIGHTLORD"`, `nightlord` = that boss’s name). Then section headers **NIGHT 1** and **NIGHT 2**; each following row is a boss with `night: "NIGHT 1"` or `night: "NIGHT 2"` and `nightlord` set to the night lord’s name.

3. **Output format**: Use the same property names and types as in `nightreign.json`: integers for percentages and buildup, `null` for missing/immune/not applicable. Normalize boss names (e.g. trim “GOLDEN HIPPO.” to “GOLDEN HIPPO”).

4. **Append to the data file**: Add the extracted entries to `_data/nightreign.json` (merge into the existing JSON array). Do **not** create a standalone JSON file unless I ask for one.

If no image is attached, ask me to provide the sheet image and then run these steps once I do.
