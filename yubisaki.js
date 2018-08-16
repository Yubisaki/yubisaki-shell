#!/usr/bin/env node

const commander = require('commander')
const path = require('path')
const chalk = require('chalk')
const figlet = require('figlet');
const semver = require('semver')
const { spawnSync } = require('child_process')
const execSync = require('child_process').execSync
const fs = require('fs')
const YAML = require('yamljs')
const ora = require('ora')

Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

console.log(
    chalk.blue.bold(
        figlet.textSync('yubisaki-shell', { horizontalLayout: 'full' })
    )
)

const packageJson = require('./package.json')

let action

const program = new commander.Command(packageJson.name)
    .version(packageJson.version)
    .arguments('<yubisaki action>')
    .usage(`${chalk.green('<yubisaki action>')}`)
    .action(name => {
        action = name
    })
    .option('-u --user <user>', 'which github account to deploy')
    .option('-p --path <path>', 'the path')
    .option('-t --page <page>', 'the article page')
    .option('-r --remote <repository>', 'the repo address')
    .allowUnknownOption()
    .on('--help', () => {
        console.log(`${chalk.cyan('yubisaki')} ${chalk.green('deploy --user <github user> --path <vuepress docs path> --remote <github repository address>')}`)
        console.log()
        console.log(`${chalk.cyan('yubisaki')} ${chalk.green('post --path <article path>')}`)
    })
    .parse(process.argv)

if(typeof action === 'undefined') {
    console.log(`${chalk.cyan('yubisaki')} ${chalk.green('your action')}`)
    console.log()
    console.log('For example:')
    console.log(`${chalk.cyan('yubisaki')} ${chalk.green('deploy <user>')}`)
    console.log()
    console.log(
        `Run ${chalk.cyan(`${'yubisaki'} --help`)} to see all options.`
    )
    process.exit(1)
}

if(action === 'post') {
    if(typeof program.path === 'undefined') {
        console.log(`${chalk.cyan('please specify the article path')}`)
        process.exit(1)
    }
    if(typeof program.page === 'undefined') {
        console.log(`${chalk.cyan('please specify the article page')}`)
        process.exit(1)
    }

    const spinner = ora('')

    const filePath = path.resolve(program.path)
    const frontmatter = normalizeYaml()
    const str = `---\n${frontmatter}---`

    const success = mkdirsSync(filePath)

    if(success) {
        fs.writeFileSync(
            path.resolve(program.path, program.page),
            str
        )
        spinner.succeed(`创建 ${path.join(program.path, program.page)} 成功`)
    }else {
        spinner.fail('创建 article 失败')
        process.exit(1)
    }
    
}

function normalizeYaml() {
    const date = new Date()
    const ymlPath = path.resolve(__dirname, 'frontmatter.yml')

    let matterObject = YAML.load(ymlPath)

    const result = Object.assign({}, matterObject, {
        date: date.Format('yyyy-MM-dd hh:mm:ss').replace(/\-/g, '/')
    })

    return YAML.stringify(result, 4, 2)
}

function mkdirsSync(dirname) {  
    if (fs.existsSync(dirname)) {  
        return true;  
    } else {  
        if (mkdirsSync(path.dirname(dirname))) {  
            fs.mkdirSync(dirname);  
            return true;
        }  
    }  
}

if(action === 'deploy') {
    if(typeof program.user === 'undefined') {
        console.log(`${chalk.cyan('please specify the github username')}`)
        process.exit(1)
    }
    if(typeof program.path === 'undefined') {
        console.log(`${chalk.cyan('please specify the docs path')}`)
        process.exit(1)
    }
    if(typeof program.remote === 'undefined') {
        console.log(`${chalk.cyan('please specify the deploy address')}`)
        process.exit(1)
    }
    const distPath = path.resolve(program.path, '.vuepress/dist')
    const spinner = ora('')
    
    const out = build(program.path)
    if(out) {
        spinner.fail('vuepress build failed')
    }else {
        deploy(distPath, program.remote, program.user)
    }
}

function build(path) {
    const { stdout, stderr } = spawnSync('vuepress', ['build', path], { stdio: 'inherit' })
    return stderr
}

function deploy(path, repo, user) {
    try {
        const spinner = ora('')
        spinner.start()
        console.log()
        execSync(`git init ${path}`)
        execSync(`cd ${path} && git add -A && git commit -m 'deploy'`)
        const args = [
            'push',
            '-f',
            `git@github.com:${user}/${repo}.git`,
            'master'
        ]
        const { stderr } = spawnSync('git', args, { stdio: 'inherit', cwd: path })
        if(!stderr) {
            spinner.succeed('deploy successfully')
        }else {
            spinner.fail('deploy failed')
        }
    } catch (e) {
        console.log(`${chalk.cyan('git deploy failed')}`)
        process.exit(1)
    }
}

