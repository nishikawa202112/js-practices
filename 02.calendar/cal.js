let year = new Date().getFullYear()
let month = new Date().getMonth() + 1
const args = process.argv.slice(2)
for (let i = 0; i < args.length; i += 2) {
  if (args[i] === '-y') {
    year = args[i + 1]
  } else if (args[i] === '-m') {
    month = args[i + 1]
  }
}
const day = new Date(year, month - 1, 1).getDay()
const lastDay = new Date(year, month, 0).getDate()
console.log(`      ${month}月 ${year}`)
console.log('日 月 火 水 木 金 土')
for (let i = 0; i < day; ++i) {
  process.stdout.write('   ')
}
for (let i = 1; i <= lastDay; ++i) {
  process.stdout.write(`${String(i).padStart(2)} `)
  if ((day + i) % 7 === 0) {
    process.stdout.write('\n')
  }
}
