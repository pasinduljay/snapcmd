use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "init_schema",
        sql: "
            create table categories (
                id         text primary key,
                name       text not null unique,
                created_at text not null default (datetime('now'))
            );

            create table snippets (
                id         text primary key,
                title      text not null,
                command    text not null,
                notes      text not null default '',
                category   text not null default 'General',
                tags       text not null default '[]',
                created_at text not null default (datetime('now')),
                updated_at text not null default (datetime('now'))
            );

            create table backups (
                id            text primary key,
                scope         text not null default 'All categories',
                snippet_count integer not null default 0,
                data          text not null,
                created_at    text not null default (datetime('now'))
            );
        ",
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:snapcmd.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
