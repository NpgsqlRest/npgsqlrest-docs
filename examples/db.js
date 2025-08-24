module.exports = {
    // path to psql and pg_dump client tools
    psql: "psql",
    pgdump: "pg_dump",

    host: "${PGHOST}",
    port: "${PGPORT}",
    dbname: "${PGDATABASE}",
    username: "${PGUSER}",
    password: "${PGPASSWORD}",

    afterPrefix: "A",
    recursiveDirs: true,
    
    /*
    When using multiple versioned migration directories, you can append
    the top directory name to the migration version to ensure uniqueness.
    */
    appendTopDirToVersion: true,

    /*
    Top directorries contaiing versioned migrations are split by the specified _ character and the
    part at the specified index is appended to the migration version.

    Example directory: sql_1
    appendTopDirToVersionSplitBy: "_" (underscore)
    appendTopDirToVersionPart: 1 (index of "1" part)
    
    Resulting migration version prefix: 1

    This avoids version conflicts when using multiple versioned migration directories having the same migration versions.
    */
    appendTopDirToVersionSplitBy: "_",
    appendTopDirToVersionPart: 1
}
