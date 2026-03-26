const spawn = require("child_process").spawn

function cmd(program, args) {
    const spawn_options = {"shell" : true};
    console.log(`CMD: ${program} ${args.flat()} ${spawn_options}`);

    const p = spawn(program, args.flat(), spawn_options);
    p.stdout.on('data', (data) => process.stdout.write(data))
    p.stderr.on('data', (data) => process.stderr.write(data))
    p.on('close', (code) => {
        if (code != 0) {
            console.error(program, args, 'exited with', code);
        }
    });
    return p;
}

cmd('./node_modules/typescript/bin/tsc', ['-w']);
cmd('python3', ['-m', 'http.server', '8888']);
