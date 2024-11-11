// 获取页面元素
const startNewGameBtn = document.getElementById('start-new-game-btn');
const loadGameBtn = document.getElementById('load-game-btn');
const nicknameInput = document.getElementById('nickname-input');
const mainMenu = document.getElementById('main-menu');
const animationContainer = document.getElementById('animation-container');
const messageContainer = document.getElementById('message-container');
const backgroundMusic = document.getElementById('background-music');
const currentSceneImg = document.getElementById('current-scene-img');
const virtualKeyboard = document.getElementById('virtual-keyboard');
const restartButtonsContainer = document.getElementById('restart-buttons-container'); // 新增的按钮容器

const playerDataKey = "playerData";
let successRateModifier = 0;

// 获取玩家数据
function getPlayerData() {
    const data = localStorage.getItem(playerDataKey);
    return data ? JSON.parse(data) : null;
}

// 保存玩家数据
function savePlayerData(playerData) {
    localStorage.setItem(playerDataKey, JSON.stringify(playerData));
}

// 初始化玩家数据
function initializePlayerData(nickname) {
    return {
        id: Date.now(),
        nickname: nickname,
        totalGames: 0,
        successfulGames: 0,
    };
}

// 更新玩家数据
function updatePlayerData(isSuccessful) {
    const playerData = getPlayerData();
    if (playerData) {
        playerData.totalGames += 1;
        if (isSuccessful) {
            playerData.successfulGames += 1;
        }
        savePlayerData(playerData);
    }
}

// 加载 data.txt 文件中的游戏描述数据
async function loadData() {
    try {
        const response = await fetch('data.txt');
        const data = await response.text();
        const sceneData = data.split('\n').reduce((acc, line) => {
            const [key, value] = line.split(': ');
            if (key && value) {
                acc[key] = value;
            }
            return acc;
        }, {});
        return sceneData;
    } catch (error) {
        console.error("加载 data.txt 文件失败：", error);
        return {};
    }
}

// 显示数据中的描述信息并加载对应的图片
async function showData(key) {
    const data = await loadData();
    if (data[key + '描述']) {
        showMessage(data[key + '描述']);
    }
    loadSceneImage(key);  // 加载对应的图片
}

// 显示消息函数，逐条显示并在每条显示后消失
function showMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.opacity = 0; // 初始透明度为 0
    messageContainer.appendChild(messageElement);

    // 使用过渡效果进行显示和消失
    setTimeout(() => {
        messageElement.style.transition = 'opacity 1s'; // 设置过渡效果
        messageElement.style.opacity = 1; // 显示消息
    }, 0);

    // 设定每条消息显示的时间
    setTimeout(() => {
        messageElement.style.opacity = 0; // 隐藏消息
         //在消息完全消失后，从 DOM 中删除该元素
        setTimeout(() => messageElement.remove(), 0);
    }, 3500); // 每条消息显示 3.5 秒钟
}

// 加载场景图片
async function loadSceneImage(scene) {
    const data = await loadData();
    const imagePath = data[scene];
    if (imagePath) {
        currentSceneImg.src = imagePath;  // 直接使用图片文件名，因为它与其他文件在同一目录
    }
}

// 启动背景音乐
function playBackgroundMusic() {
    backgroundMusic.loop = true;
    backgroundMusic.play();
}

// 停止背景音乐
function stopBackgroundMusic() {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
}

// 启动游戏
function startGame() {
    mainMenu.style.display = 'none';
    animationContainer.style.display = 'flex';
    messageContainer.innerHTML = '';  // 清空消息
    messageContainer.style.display = 'block'; // 确保 messageContainer 可见
    restartButtonsContainer.style.display = 'none'; // 隐藏“再来一次”和“返回主菜单”按钮

    playBackgroundMusic();  // 启动背景音乐
    animateTreasureHunt();  // 开始游戏动画流程
}

// 主菜单按钮点击事件
startNewGameBtn.addEventListener('click', () => {
    const nickname = nicknameInput.value.trim();
    if (!nickname) {
        alert("请输入昵称！");
        return;
    }
    const playerData = initializePlayerData(nickname);
    savePlayerData(playerData);
    startGame();  // 启动游戏
});

loadGameBtn.addEventListener('click', () => {
    const playerData = getPlayerData();
    if (playerData) {
        alert(`欢迎回来，${playerData.nickname}！你已玩了 ${playerData.totalGames} 次，成功了 ${playerData.successfulGames} 次。`);
        startGame(); // 开始游戏时，触发背景音乐播放
    } else {
        alert("没有找到存档，请先开始新游戏！");
    }
});

// 游戏动画流程
async function animateTreasureHunt() {
    await showData('图书馆');
    await wait(3500);

    // 选择行动：巡视神庙或敲开地面
    await showData('神庙');
    await showMessage("你来到了神庙，选择你的行动：");
    createVirtualButtons();
}

// 创建虚拟按钮供玩家选择行动
function createVirtualButtons() {
    const button1 = document.createElement('button');
    button1.textContent = "巡视神庙";
    button1.addEventListener('click', () => handlePatrolChoice());
    virtualKeyboard.appendChild(button1);

    const button2 = document.createElement('button');
    button2.textContent = "敲开地面";
    button2.addEventListener('click', () => handleDigChoice());
    virtualKeyboard.appendChild(button2);
}

// 处理巡视神庙的选择
async function handlePatrolChoice() {
    hideButtons(); // 隐藏选择按钮
    // 增加异步操作，让玩家有时间看到成功概率的变化
    await showData('巡视神庙');
    await showMessage("你选择了巡视神庙，正在搜寻线索...");
    await wait(3500);

    successRateModifier = (Math.random() * 0.2) - 0.1; // -10% 到 +10% 的变化
    
    if (successRateModifier > 0) {
        showMessage(`恭喜！我们找到了一些线索，这让我们离宝藏更近了，经过计算，这条线索让我们 ${Math.round(successRateModifier * 100)}%的成功率`);
    } else {
        showMessage(`警告！我们受到神庙陷阱的伤害，经过计算，这次受伤让我的找的宝藏的概率 ${Math.round(successRateModifier * 100)}%`);
    }

    await wait(3500); // 等待3.5秒后，显示调整后的结果
    startTempleSearch();
}

// 处理敲开地面的选择
async function handleDigChoice() {
    hideButtons(); // 隐藏选择按钮
    // 增加异步操作，让玩家有时间看到成功概率的变化
    await showData('敲开地面');
    await showMessage("你选择了敲开地面，希望能有所收获...");
    await wait(3500); // 等待3.5秒后，显示调整后的结果

    successRateModifier = (Math.random() * 0.8) - 0.4; // -40% 到 +40% 的变化
    
    if (successRateModifier > 0) {
        showMessage(`恭喜！这下面就是宝藏，经过计算，在守卫来之前我们${Math.round(successRateModifier * 100)}%的成功率`);
    } else {
        showMessage(`警告！这动静太大了，守卫很有可能会出现，经过计算，找到宝藏的概率 ${Math.round(successRateModifier * 100)}%`);
    }

    await wait(3500); // 等待3.5秒后，显示调整后的结果
    
    startTempleSearch();
}


// 隐藏选择按钮
function hideButtons() {
    virtualKeyboard.innerHTML = ''; // 清空虚拟按钮
}

// 开始搜索神庙，判断是否成功
async function startTempleSearch() {
    const baseSuccessRate = 0.5; // 基本成功率为 50%
    const adjustedSuccessRate = baseSuccessRate + successRateModifier;

    if (Math.random() < adjustedSuccessRate) {
        showMessage("恭喜！你成功找到了神秘的宝藏！");
        currentSceneImg.src = 'temple_treasure_box.jpg';  // 显示找到宝藏的图片
        updatePlayerData(true);
    } else {
        showMessage("糟糕！你遇到了神庙守卫，被守卫击败！");
        currentSceneImg.src = 'temple_guard.jpg';  // 显示守卫的图片
        updatePlayerData(false);
    }
    await wait(2000);
    showRestartButtons();  // 显示结束后的操作按钮
}

// 游戏继续的逻辑
async function continueGame() {
    currentSceneImg.src = 'temple_treasure_box.jpg';
    showMessage("你找到了一个神秘的宝箱！");
    showRestartButtons();  // 显示结束后的操作按钮
}

// 等待指定毫秒数的函数
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 显示“再来一次”和“返回主菜单”按钮
function showRestartButtons() {
    restartButtonsContainer.style.display = 'flex'; // 显示按钮容器
}

// 重新开始游戏
function restartGame() {
    successRateModifier = 0;  // 重置成功率修改值
    currentSceneImg.src = '';  // 清空图片
    messageContainer.innerHTML = '';  // 清空消息容器
    startGame();  // 重新开始游戏
}

// 返回主菜单
function goToMainMenu() {
    mainMenu.style.display = 'flex'; // 显示主菜单
    animationContainer.style.display = 'none'; // 隐藏游戏内容
    restartButtonsContainer.style.display = 'none'; // 隐藏“再来一次”和“返回主菜单”按钮
}

// 添加“再来一次”和“返回主菜单”的按钮
const restartButtonsHTML = `
    <button id="restart-btn">再来一次</button>
    <button id="main-menu-btn">返回主菜单</button>
`;

document.getElementById('restart-buttons-container').innerHTML = restartButtonsHTML;

document.getElementById('restart-btn').addEventListener('click', restartGame);
document.getElementById('main-menu-btn').addEventListener('click', goToMainMenu);
