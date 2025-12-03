#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const glob = require('glob');

function readGitignore() {
    if (!fs.existsSync('.gitignore')) return [];
    const raw = fs.readFileSync('.gitignore', 'utf8');
    // split, trim, remove comments and blank lines, remove CR if present
    return raw.split('\n')
        .map(s => s.replace(/\r$/, '').trim())
        .filter(s => s && !s.startsWith('#'));
}

async function main() {
    const args = minimist(process.argv.slice(2));
    let ext = args.ext || args.e;
    const useGitignore = !!(args.gitignore || args.g);

    if (!ext) {
        console.error('Please provide a file extension using --ext or -e.');
        process.exit(1);
    }
    if (!ext.startsWith('.')) ext = '.' + ext;

    const ignorePatterns = useGitignore ? readGitignore() : [];

    // build glob pattern for recursive search
    const globPattern = `**/*${ext}`;

    // use glob to list files recursively (relative paths)
    const files = glob.sync(globPattern, {
        nodir: true,
        dot: true, // include dotfiles if extension matches
        ignore: ['**/.git/**'] // always ignore .git internal folder
    });

    let filtered = files;

    if (useGitignore && ignorePatterns.length) {
        // try using ignore package for correct gitignore semantics (negation, dirs, etc.)
        const ignore = require('ignore');
        const ig = ignore().add(ignorePatterns);
        filtered = files.filter(f => !ig.ignores(f));
    }

    // print each file with content (paths are relative)
    for (const file of filtered) {
        console.log(`${file}:`);
        console.log('```');
        const content = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
        console.log(content);
        console.log('```');
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
