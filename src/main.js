const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const { glob } = require('glob');
const micromatch = require('micromatch');

async function main() {
    const args = minimist(process.argv.slice(2));
    const ext = args.ext || args.e;
    const useGitignore = args.gitignore || args.g;

    if (!ext) {
        console.error('Please provide a file extension using --ext or -e.');
        process.exit(1);
    }

    let ignorePatterns = [];
    if (useGitignore && fs.existsSync('.gitignore')) {
        const gitignoreContent = fs.readFileSync('.gitignore', 'utf-8');
        ignorePatterns = gitignoreContent.split('\n').filter(line => line.trim() !== '' && !line.startsWith('#'));
    }

    const files = await glob(`**/*${ext}`, {
        nodir: true,
        dot: true,
        ignore: ['node_modules/**'],
    });

    for (const file of files) {
        if (useGitignore && micromatch.isMatch(file, ignorePatterns)) {
            continue;
        }

        console.log(`${file}:`);
        console.log('```');
        const content = fs.readFileSync(file, 'utf-8');
        console.log(content);
        console.log('```');
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});