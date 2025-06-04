const axios = require('axios');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

// 配置参数
const API_URL = 'https://task.952737.xyz/queryTasks?type=scheduled_js&status=pending'; // 替换为实际API地址
const OUTPUT_FILE = path.join(__dirname, 'execute.js');
const RESULTS_FILE = path.join(__dirname, 'script-results.html');

async function processScripts(scripts) {
  const stream = fs.createWriteStream(OUTPUT_FILE, { flags: 'w' });

  // 写入文件头部
  stream.write(`// 自动生成的脚本文件\n`);
  stream.write(`// 生成时间: ${new Date().toISOString()}\n`);
  stream.write(`// 脚本总数: ${scripts.length}\n\n`);

  // 创建共享上下文对象和结果存储
  stream.write(`// ===== 共享上下文和结果存储 =====\n`);
  stream.write(`const __context = {};\n`);
  stream.write(`const __results = new Map(); // 使用Map存储结果\n`);
  stream.write(`const fs = require('fs');\n`);
  stream.write(`const path = require('path');\n`);
  stream.write(`const RESULTS_FILE = ${JSON.stringify(RESULTS_FILE)};\n\n`);

  // 添加执行函数
  stream.write(`// ===== 脚本执行器 =====\n`);
  stream.write(`async function __runScript(id, script) {\n`);
  stream.write(`  const __start = Date.now();\n`);
  stream.write(`  console.log(\`🚀 开始执行脚本 \${id}\`);\n`);
  stream.write(`  let result = { \n`);
  stream.write(`    id: id,\n`);
  stream.write(`    success: false, \n`);
  stream.write(`    output: null, \n`);
  stream.write(`    error: null, \n`);
  stream.write(`    duration: 0,\n`);
  stream.write(`    logs: [] // 用于存储日志\n`);
  stream.write(`  };\n`);
  stream.write(`  \n`);
  stream.write(`  // 重写console方法捕获日志\n`);
  stream.write(`  const originalConsole = { ...console };\n`);
  stream.write(`  ['log', 'info', 'warn', 'error'].forEach(method => {\n`);
  stream.write(`    console[method] = (...args) => {\n`);
  stream.write(`      result.logs.push({\n`);
  stream.write(`        type: method,\n`);
  stream.write(`        timestamp: new Date().toISOString(),\n`);
  stream.write(`        message: args.map(arg => \n`);
  stream.write(`          typeof arg === 'object' ? JSON.stringify(arg) : arg\n`);
  stream.write(`        ).join(' ')\n`);
  stream.write(`      });\n`);
  stream.write(`      originalConsole[method](...args);\n`);
  stream.write(`    };\n`);
  stream.write(`  });\n`);
  stream.write(`  \n`);
  stream.write(`  try {\n`);
  stream.write(`    // 执行脚本并捕获返回值\n`);
  stream.write(`    const scriptResult = script.call(__context);\n`);
  stream.write(`    \n`);
  stream.write(`    // 处理异步结果\n`);
  stream.write(`    if (scriptResult && typeof scriptResult.then === 'function') {\n`);
  stream.write(`      result.output = await scriptResult;\n`);
  stream.write(`    } else {\n`);
  stream.write(`      result.output = scriptResult;\n`);
  stream.write(`    }\n`);
  stream.write(`    result.success = true;\n`);
  stream.write(`  } catch (error) {\n`);
  stream.write(`    result.error = {\n`);
  stream.write(`      message: error.message,\n`);
  stream.write(`      stack: error.stack\n`);
  stream.write(`    };\n`);
  stream.write(`    console.error(\`❌ 脚本 \${id} 执行失败: \${error.message}\`);\n`);
  stream.write(`  } finally {\n`);
  stream.write(`    // 恢复原始console\n`);
  stream.write(`    Object.assign(console, originalConsole);\n`);
  stream.write(`    \n`);
  stream.write(`    result.duration = Date.now() - __start;\n`);
  stream.write(`    console.log(\`🕒 脚本 \${id} 执行时间: \${result.duration}ms\`);\n`);
  stream.write(`    __results.set(id, result);\n`);
  stream.write(`  }\n`);
  stream.write(`  return result;\n`);
  stream.write(`}\n\n`);

  // 添加主执行逻辑
  stream.write(`// ===== 主执行流程 =====\n`);
  stream.write(`(async function main() {\n`);
  stream.write(`  try {\n`);

  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    const scriptId = i + 1;

    try {
      // 添加脚本注释
      stream.write(`    // === 脚本 ${scriptId}/${scripts.length} ===\n`);

      // 写入执行调用
      stream.write(`    await __runScript(${scriptId}, () => {\n`);

      // 写入脚本内容（带缩进）
      const indentedScript = script.replace(/\n/g, '\n      ');
      stream.write(`      ${indentedScript}\n`);

      stream.write(`    });\n\n`);

      console.log(`✅ 脚本 ${scriptId}/${scripts.length} 写入成功`);
    } catch (error) {
      console.error(`❌ 脚本 ${scriptId}/${scripts.length} 写入失败:`, error.message);
      stream.write(`    // [错误] 脚本 ${scriptId} 写入失败: ${error.message}\n`);
    }
  }

  // 结束主函数并保存结果为HTML
  stream.write(`    // 生成HTML报告\n`);
  stream.write(`    const resultsArray = Array.from(__results.values());\n`);
  stream.write(`    \n`);
  stream.write(`    const htmlContent = generateHTMLReport(resultsArray);\n`);
  stream.write(`    \n`);
  stream.write(`    fetch("https://task.952737.xyz/send-mail", {\n`);
  stream.write(`      method: "POST",\n`);
  stream.write(`      headers: {\n`);
  stream.write(`        "Content-Type": "application/json",\n`);
  stream.write(`      },\n`);
  stream.write(`      body: JSON.stringify({\n`);
  stream.write(`        subject: '脚本执行报告',\n`);
  stream.write(`        html: \`\${htmlContent}\`,\n`);
  stream.write(`      }),\n`);
  stream.write(`    });\n`);
  stream.write(`    fs.writeFileSync(\n`);
  stream.write(`      RESULTS_FILE,\n`);
  stream.write(`      htmlContent,\n`);
  stream.write(`      'utf-8'\n`);
  stream.write(`    );\n`);
  stream.write(`    console.log(\`✅ 所有脚本执行完成，HTML报告已保存至: \${RESULTS_FILE}\`);\n`);

  stream.write(`  } catch (error) {\n`);
  stream.write(`    console.error('全局错误:', error);\n`);
  stream.write(`    process.exit(1);\n`);
  stream.write(`  }\n`);
  stream.write(`})();\n\n`);

  // 添加HTML生成函数
  stream.write(`// ===== HTML报告生成器 =====\n`);
  stream.write(`function generateHTMLReport(results) {\n`);
  stream.write(`  const totalScripts = results.length;\n`);
  stream.write(`  const successCount = results.filter(r => r.success).length;\n`);
  stream.write(`  const errorCount = totalScripts - successCount;\n`);
  stream.write(`  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);\n`);
  stream.write(`  \n`);
  stream.write(`  return \`<!DOCTYPE html>\n`);
  stream.write(`<html lang="zh-CN">\n`);
  stream.write(`<head>\n`);
  stream.write(`  <meta charset="UTF-8">\n`);
  stream.write(`  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n`);
  stream.write(`  <title>脚本执行报告</title>\n`);
  stream.write(`  <style>\n`);
  stream.write(`    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }\n`);
  stream.write(`    .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n`);
  stream.write(`    .summary { display: flex; gap: 20px; margin-top: 15px; flex-wrap: wrap; }\n`);
  stream.write(`    .summary-card { flex: 1; min-width: 200px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }\n`);
  stream.write(`    .success { color: #28a745; }\n`);
  stream.write(`    .error { color: #dc3545; }\n`);
  stream.write(`    .script-card { background: white; margin-bottom: 20px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n`);
  stream.write(`    .script-header { padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }\n`);
  stream.write(`    .success-bg { background: #d4edda; }\n`);
  stream.write(`    .error-bg { background: #f8d7da; }\n`);
  stream.write(`    .script-content { padding: 20px; border-top: 1px solid #eee; }\n`);
  stream.write(`    .logs { background: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 15px; max-height: 200px; overflow-y: auto; }\n`);
  stream.write(`    .log-entry { padding: 5px 0; border-bottom: 1px solid #eee; font-family: monospace; font-size: 14px; }\n`);
  stream.write(`    .log-info { color: #17a2b8; }\n`);
  stream.write(`    .log-warn { color: #ffc107; }\n`);
  stream.write(`    .log-error { color: #dc3545; }\n`);
  stream.write(`    .output { background: #e9ecef; padding: 10px; border-radius: 4px; margin-top: 10px; font-family: monospace; white-space: pre-wrap; }\n`);
  stream.write(`    .error-details { background: #f8d7da; padding: 15px; border-radius: 4px; margin-top: 10px; }\n`);
  stream.write(`    pre { white-space: pre-wrap; font-family: monospace; }\n`);
  stream.write(`    .toggle { cursor: pointer; color: #007bff; user-select: none; }\n`);
  stream.write(`    .hidden { display: none; }\n`);
  stream.write(`    .timestamp { color: #6c757d; font-size: 0.9em; }\n`);
  stream.write(`  </style>\n`);
  stream.write(`</head>\n`);
  stream.write(`<body>\n`);
  stream.write(`  <div class="header">\n`);
  stream.write(`    <h1>脚本执行报告</h1>\n`);
  stream.write(`    <p>生成时间: ${new Date().toISOString()}</p>\n`);
  stream.write(`    \n`);
  stream.write(`    <div class="summary">\n`);
  stream.write(`      <div class="summary-card">\n`);
  stream.write(`        <h3>脚本总数</h3>\n`);
  stream.write(`        <p style="font-size: 24px; font-weight: bold;">\${totalScripts}</p>\n`);
  stream.write(`      </div>\n`);
  stream.write(`      <div class="summary-card">\n`);
  stream.write(`        <h3>成功</h3>\n`);
  stream.write(`        <p class="success" style="font-size: 24px; font-weight: bold;">\${successCount}</p>\n`);
  stream.write(`      </div>\n`);
  stream.write(`      <div class="summary-card">\n`);
  stream.write(`        <h3>失败</h3>\n`);
  stream.write(`        <p class="error" style="font-size: 24px; font-weight: bold;">\${errorCount}</p>\n`);
  stream.write(`      </div>\n`);
  stream.write(`      <div class="summary-card">\n`);
  stream.write(`        <h3>总执行时间</h3>\n`);
  stream.write(`        <p style="font-size: 24px; font-weight: bold;">\${totalDuration}ms</p>\n`);
  stream.write(`      </div>\n`);
  stream.write(`    </div>\n`);
  stream.write(`  </div>\n`);
  stream.write(`  \n`);
  stream.write(`  <div class="scripts-container">\n`);
  stream.write(`    \${results.map(result => \`\n`);
  stream.write(`      <div class="script-card">\n`);
  stream.write(`        <div class="script-header \${result.success ? 'success-bg' : 'error-bg'}">\n`);
  stream.write(`          <div>\n`);
  stream.write(`            <h2>脚本 #\${result.id} - \${result.success ? '✅ 成功' : '❌ 失败'}</h2>\n`);
  stream.write(`            <p>执行时间: \${result.duration}ms</p>\n`);
  stream.write(`          </div>\n`);
  stream.write(`          <div class="toggle" onclick="toggleDetails('\${result.id}')">\n`);
  stream.write(`            \${result.success ? '查看详情' : '查看错误'}\n`);
  stream.write(`          </div>\n`);
  stream.write(`        </div>\n`);
  stream.write(`        \n`);
  stream.write(`        <div class="script-content" id="details-\${result.id}">\n`);
  stream.write(`          <div>\n`);
  stream.write(`            <h3>输出结果</h3>\n`);
  stream.write(`            <div class="output">\n`);
  stream.write(`              \${result.output ? (typeof result.output === 'object' ? JSON.stringify(result.output, null, 2) : result.output) : '无输出'}\n`);
  stream.write(`            </div>\n`);
  stream.write(`          </div>\n`);
  stream.write(`          \n`);
  stream.write(`          \${!result.success ? \`\n`);
  stream.write(`            <div class="error-details">\n`);
  stream.write(`              <h3>错误详情</h3>\n`);
  stream.write(`              <p><strong>消息:</strong> \${result.error.message}</p>\n`);
  stream.write(`              <pre>\${result.error.stack}</pre>\n`);
  stream.write(`            </div>\n`);
  stream.write(`          \` : ''}\n`);
  stream.write(`          \n`);
  stream.write(`          \${result.logs.length > 0 ? \`\n`);
  stream.write(`            <div>\n`);
  stream.write(`              <h3>执行日志 (\${result.logs.length}条)</h3>\n`);
  stream.write(`              <div class="logs">\n`);
  stream.write(`                \${result.logs.map(log => \`\n`);
  stream.write(`                  <div class="log-entry log-\${log.type}">\n`);
  stream.write(`                    <span class="timestamp">[\${log.timestamp}]</span>\n`);
  stream.write(`                    <span>\${log.message}</span>\n`);
  stream.write(`                  </div>\n`);
  stream.write(`                \`).join('')}\n`);
  stream.write(`              </div>\n`);
  stream.write(`            </div>\n`);
  stream.write(`          \` : ''}\n`);
  stream.write(`        </div>\n`);
  stream.write(`      </div>\n`);
  stream.write(`    \`).join('')}\n`);
  stream.write(`  </div>\n`);
  stream.write(`  \n`);
  stream.write(`  <script>\n`);
  stream.write(`    function toggleDetails(id) {\n`);
  stream.write(`      const details = document.getElementById('details-' + id);\n`);
  stream.write(`      details.classList.toggle('hidden');\n`);
  stream.write(`    }\n`);
  stream.write(`    \n`);
  stream.write(`    // 默认展开所有错误详情\n`);
  stream.write(`    document.querySelectorAll('.script-card').forEach(card => {\n`);
  stream.write(`      if (card.querySelector('.error-bg')) {\n`);
  stream.write(`        card.querySelector('.script-content').classList.remove('hidden');\n`);
  stream.write(`      }\n`);
  stream.write(`    });\n`);
  stream.write(`  </script>\n`);
  stream.write(`</body>\n`);
  stream.write(`</html>\n`);
  stream.write(`  \`;\n`);
  stream.write(`}\n`);

  stream.end();

  return new Promise((resolve) => {
    stream.on('finish', () => {
      console.log(`\n脚本文件生成完成: ${OUTPUT_FILE}`);
      console.log(`执行后将保存HTML报告至: ${RESULTS_FILE}`);
      resolve();
    });
  });
}

async function main() {
  try {
    console.log('⏳ 正在从远程API获取数据...');
    const response = await axios.get(API_URL, {
      timeout: 10000,
      headers: { 'User-Agent': 'ScriptCombiner/1.0' }
    });

    // 从response.data.result获取数据
    const data = response.data?.result || response.data;

    if (!Array.isArray(data)) {
      throw new Error('API返回的数据不是有效列表');
    }

    const needUpdateStatusTask = [];
    // 过滤无效脚本
    const validScripts = data
      .filter(it => {
        if (it.frequency_type === 'daily') {
          const deadline_at = JSON.parse(it.extra_data)?.deadline_at;
          const flag = moment(deadline_at).isSameOrBefore(moment(), 'day');
          if (flag) {
            needUpdateStatusTask.push(it);
          }
          return !flag;
        } else if (it.frequency_type === 'specific_date') {
          const flag = moment(it.specific_date).isSame(moment(), 'day');
          if (flag) {
            needUpdateStatusTask.push(it);
          }
          return flag;
        }
        return true;
      })
      .map(item => item.script)
      .filter(script => typeof script === 'string' && script.trim() !== '');

    console.log(`📥 获取到 ${data.length} 条记录，有效脚本 ${validScripts.length} 个`, needUpdateStatusTask);

    if (validScripts.length === 0) {
      console.log('⚠️ 没有有效脚本可处理');
      return;
    }

    return processScripts(validScripts);
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    if (error.response) {
      console.error(`HTTP 状态码: ${error.response.status}`);
      console.error(`响应数据: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    process.exit(1);
  }
}

// 启动
main();