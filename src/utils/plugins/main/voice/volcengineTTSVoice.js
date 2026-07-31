const path = require("path");
const fs = require("fs");
const axios = require("axios");
const getAudioPath = async (text, speed, dirPath, config) => {
    let audioName = new Date().getTime() + ".mp3";
    if (!fs.existsSync(path.join(dirPath, "tts"))) {
        fs.mkdirSync(path.join(dirPath, "tts"));
    }
    fs.writeFileSync(path.join(dirPath, "tts", audioName), await getTTSAudio(text, speed, config));
    return path.join(dirPath, "tts", audioName);
};
const mapSpeedToSpeechRate = (speed) => {
    if (!speed || speed === 1.0)
        return 0;
    return Math.min(100, Math.max(-50, Math.round((speed - 1) * 100)));
};
const parseChunkedResponse = (responseText) => {
    const audioChunks = [];
    const lines = responseText.split("\n");
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed)
            continue;
        try {
            const obj = JSON.parse(trimmed);
            const code = obj.code || 0;
            if (code === 20000000)
                continue;
            if (code !== 0) {
                throw new Error(obj.message || `TTS error code ${code}`);
            }
            if (obj.data) {
                audioChunks.push(Buffer.from(obj.data, "base64"));
            }
        }
        catch (err) {
            if (err instanceof Error && err.message.startsWith("TTS error"))
                throw err;
        }
    }
    return Buffer.concat(audioChunks);
};
const getTTSAudio = async (text, speed, config) => {
    const apiKey = config.apiKey || "";
    if (!apiKey) {
        return Promise.reject("Missing API Key");
    }
    const voiceName = config.voiceName || "zh_female_vv_uranus_bigtts";
    const resourceId = config.resourceId || "seed-tts-2.0";
    const url = "https://openspeech.bytedance.com/api/v3/tts/unidirectional";
    const audioParams = {
        format: "mp3",
        sample_rate: 24000,
    };
    const speechRate = mapSpeedToSpeechRate(speed);
    if (speechRate !== 0) {
        audioParams.speech_rate = speechRate;
    }
    const payload = {
        req_params: {
            text: text,
            speaker: voiceName,
            audio_params: audioParams,
        },
    };
    return new Promise((resolve, reject) => {
        axios
            .post(url, payload, {
            headers: {
                "X-Api-Key": apiKey,
                "Content-Type": "application/json",
                "X-Api-Resource-Id": resourceId,
            },
            responseType: "text",
            timeout: 60000,
        })
            .then((response) => {
            const audioBuffer = parseChunkedResponse(response.data);
            if (!audioBuffer.length) {
                reject("No audio data in response");
                return;
            }
            resolve(audioBuffer);
        })
            .catch((error) => {
            reject("");
        });
    });
};
const VOICES_2_0 = [
    { name: "zh_female_vv_uranus_bigtts", displayName: "Vivi 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_xiaohe_uranus_bigtts", displayName: "小何 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_male_m191_uranus_bigtts", displayName: "云舟 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_male_taocheng_uranus_bigtts", displayName: "小天 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_male_liufei_uranus_bigtts", displayName: "刘飞 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_female_sophie_uranus_bigtts", displayName: "魅力苏菲 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_qingxinnvsheng_uranus_bigtts", displayName: "清新女声 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_cancan_uranus_bigtts", displayName: "知性灿灿 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_sajiaoxuemei_uranus_bigtts", displayName: "撒娇学妹 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_tianmeixiaoyuan_uranus_bigtts", displayName: "甜美小源 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_tianmeitaozi_uranus_bigtts", displayName: "甜美桃子 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_shuangkuaisisi_uranus_bigtts", displayName: "爽快思思 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_peiqi_uranus_bigtts", displayName: "佩奇猪 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_linjianvhai_uranus_bigtts", displayName: "邻家女孩 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_male_shaonianzixin_uranus_bigtts", displayName: "少年梓辛/ Brayan 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_male_sunwukong_uranus_bigtts", displayName: "猴哥 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_female_yingyujiaoxue_uranus_bigtts", displayName: "Tina老师 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_kefunvsheng_uranus_bigtts", displayName: "暖阳女声 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_xiaoxue_uranus_bigtts", displayName: "儿童绘本 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_male_dayi_uranus_bigtts", displayName: "大壹 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_female_mizai_uranus_bigtts", displayName: "黑猫侦探社 咪仔 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_jitangnv_uranus_bigtts", displayName: "鸡汤女 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_meilinvyou_uranus_bigtts", displayName: "魅力女友 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_liuchangnv_uranus_bigtts", displayName: "流畅女声 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_male_ruyayichen_uranus_bigtts", displayName: "儒雅逸辰 2.0", gender: "male", locale: "zh-CN" },
    { name: "en_male_tim_uranus_bigtts", displayName: "Tim", gender: "male", locale: "en-US" },
    { name: "en_female_dacey_uranus_bigtts", displayName: "Dacey", gender: "female", locale: "en-US" },
    { name: "en_female_stokie_uranus_bigtts", displayName: "Stokie", gender: "female", locale: "en-US" },
    { name: "zh_female_wenroumama_uranus_bigtts", displayName: "温柔妈妈 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_male_jieshuoxiaoming_uranus_bigtts", displayName: "解说小明 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_female_tvbnv_uranus_bigtts", displayName: "TVB女声 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_male_yizhipiannan_uranus_bigtts", displayName: "译制片男 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_female_qiaopinv_uranus_bigtts", displayName: "俏皮女声 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_zhishuaiyingzi_uranus_bigtts", displayName: "直率英子 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_male_linjiananhai_uranus_bigtts", displayName: "邻家男孩 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_male_silang_uranus_bigtts", displayName: "四郎 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_male_ruyaqingnian_uranus_bigtts", displayName: "儒雅青年 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_male_qingcang_uranus_bigtts", displayName: "擎苍 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_male_xionger_uranus_bigtts", displayName: "熊二 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_female_yingtaowanzi_uranus_bigtts", displayName: "樱桃丸子 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_male_wennuanahu_uranus_bigtts", displayName: "温暖阿虎/ Alvin 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_male_naiqimengwa_uranus_bigtts", displayName: "奶气萌娃 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_female_popo_uranus_bigtts", displayName: "婆婆 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_gaolengyujie_uranus_bigtts", displayName: "高冷御姐 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_male_aojiaobazong_uranus_bigtts", displayName: "傲娇霸总 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_male_lanyinmianbao_uranus_bigtts", displayName: "懒音绵宝 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_female_wenroushunv_uranus_bigtts", displayName: "温柔淑女 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_gufengshaoyu_uranus_bigtts", displayName: "古风少御 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_male_huolixiaoge_uranus_bigtts", displayName: "活力小哥 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_male_baqiqingshu_uranus_bigtts", displayName: "霸气青叔 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_male_xuanyijieshuo_uranus_bigtts", displayName: "悬疑解说 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_female_mengyatou_uranus_bigtts", displayName: "萌丫头/ Cutey 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_tiexinnvsheng_uranus_bigtts", displayName: "贴心女声/ Candy 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_jitangmei_uranus_bigtts", displayName: "鸡汤妹妹/", gender: "female", locale: "zh-CN" },
    { name: "zh_male_cixingjieshuonan_uranus_bigtts", displayName: "磁性解说男 声/Morgan 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_male_liangsangmengzai_uranus_bigtts", displayName: "亮嗓萌仔 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_female_kailangjiejie_uranus_bigtts", displayName: "开朗姐姐 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_male_gaolengchenwen_uranus_bigtts", displayName: "高冷沉稳 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_male_shenyeboke_uranus_bigtts", displayName: "深夜播客 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_male_lubanqihao_uranus_bigtts", displayName: "鲁班七号 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_female_jiaochuannv_uranus_bigtts", displayName: "娇喘女声 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_linxiao_uranus_bigtts", displayName: "邻萧 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_lingling_uranus_bigtts", displayName: "玲玲姐姐 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_chunribu_uranus_bigtts", displayName: "春日部姐姐 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_male_tangseng_uranus_bigtts", displayName: "唐僧 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_male_zhuangzhou_uranus_bigtts", displayName: "庄周 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_male_kailangdidi_uranus_bigtts", displayName: "开朗弟弟 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_male_zhubajie_uranus_bigtts", displayName: "猪八戒 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_female_ganmaodianyin_uranus_bigtts", displayName: "感冒电音姐 姐 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_chanmeinv_uranus_bigtts", displayName: "谄媚女声 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_nvleishen_uranus_bigtts", displayName: "女雷神 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_qinqienv_uranus_bigtts", displayName: "亲切女声 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_male_kuailexiaodong_uranus_bigtts", displayName: "快乐小东 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_male_kailangxuezhang_uranus_bigtts", displayName: "开朗学长 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_male_youyoujunzi_uranus_bigtts", displayName: "悠悠君子 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_female_wenjingmaomao_uranus_bigtts", displayName: "文静毛毛 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_zhixingnv_uranus_bigtts", displayName: "知性女声 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_male_qingshuangnanda_uranus_bigtts", displayName: "清爽男大 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_male_yuanboxiaoshu_uranus_bigtts", displayName: "渊博小叔 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_male_yangguangqingnian_uranus_bigtts", displayName: "阳光青年 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_female_qingchezizi_uranus_bigtts", displayName: "清澈梓梓 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_tianmeiyueyue_uranus_bigtts", displayName: "甜美悦悦 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_xinlingjitang_uranus_bigtts", displayName: "心灵鸡汤 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_male_wenrouxiaoge_uranus_bigtts", displayName: "温柔小哥 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_female_roumeinvyou_uranus_bigtts", displayName: "柔美女友 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_male_dongfanghaoran_uranus_bigtts", displayName: "东方浩然 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_female_wenrouxiaoya_uranus_bigtts", displayName: "温柔小雅 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_male_tiancaitongsheng_uranus_bigtts", displayName: "天才童声 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_female_wuzetian_uranus_bigtts", displayName: "武则天 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_female_gujie_uranus_bigtts", displayName: "顾姐 2.0", gender: "female", locale: "zh-CN" },
    { name: "zh_male_guanggaojieshuo_uranus_bigtts", displayName: "广告解说 2.0", gender: "male", locale: "zh-CN" },
    { name: "zh_female_shaoergushi_uranus_bigtts", displayName: "少儿故事 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_en_female_charlie_tob", displayName: "Charlie 2.0", gender: "female", locale: "en-US" },
    { name: "ICL_uranus_en_male_ethan_tob", displayName: "Ethan 2.0", gender: "male", locale: "en-US" },
    { name: "ICL_uranus_en_male_alastor_tob", displayName: "Alastor 2.0", gender: "male", locale: "en-US" },
    { name: "ICL_uranus_en_male_chucky_tob", displayName: "Chucky 2.0", gender: "male", locale: "en-US" },
    { name: "ICL_uranus_en_male_noah_tob", displayName: "Noah 2.0", gender: "male", locale: "en-US" },
    { name: "ICL_uranus_en_male_jigsaw_tob", displayName: "Jigsaw 2.0", gender: "male", locale: "en-US" },
    { name: "ICL_uranus_en_male_clown_man_tob", displayName: "Clown Man 2.0", gender: "male", locale: "en-US" },
    { name: "ICL_uranus_en_male_cartoon_chef_tob", displayName: "Cartoon Chef 2.0", gender: "male", locale: "en-US" },
    { name: "ICL_uranus_en_male_frosty_man_tob", displayName: "Frosty Man 2.0", gender: "male", locale: "en-US" },
    { name: "ICL_uranus_en_male_the_grinch_tob", displayName: "The Grinch 2.0", gender: "male", locale: "en-US" },
    { name: "ICL_uranus_en_male_kevin_mccallister_tob", displayName: "Kevin McCallister 2.0", gender: "male", locale: "en-US" },
    { name: "ICL_uranus_en_male_michael_tob", displayName: "Michael 2.0", gender: "male", locale: "en-US" },
    { name: "ICL_uranus_en_male_big_boogie_tob", displayName: "Big Boogie 2.0", gender: "male", locale: "en-US" },
    { name: "ICL_uranus_en_male_xavier_tob", displayName: "Xavier 2.0", gender: "male", locale: "en-US" },
    { name: "ICL_uranus_en_male_zayne_tob", displayName: "Zayne 2.0", gender: "male", locale: "en-US" },
    { name: "ICL_uranus_zh_female_aojiaonvyou_tob", displayName: "傲娇女友 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_aomanjiaosheng_tob", displayName: "傲慢娇声 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_xiemeinvwang_tob", displayName: "邪魅女王 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_bingjiaojiejie_tob", displayName: "病娇姐姐 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_bingjiaomengmei_tob", displayName: "病娇萌妹 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_bingruoshaonv_tob", displayName: "病弱少女 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_chengshuwenrou_tob", displayName: "成熟温柔 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_chengshujiejie_tob", displayName: "成熟姐姐 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_chunzhenshaonv_tob", displayName: "纯真少女 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_chunchenvsheng_tob", displayName: "纯澈女生 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_wumeikeren_tob", displayName: "妩媚可人 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_heainainai_tob", displayName: "乖巧可儿 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_huopodiaoman_tob", displayName: "活泼刁蛮 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_huoponvhai_tob", displayName: "活泼女孩 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_jiaohannvwang_tob", displayName: "娇憨女王 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_jiaoruoluoli_tob", displayName: "娇弱萝莉 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_jiaxiaozi_tob", displayName: "假小子 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_jinglingxiangdao_tob", displayName: "精灵向导 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_kaixinxiaohong_tob", displayName: "开朗婷婷 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_keainvsheng_tob", displayName: "可爱女生 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_lingdongxinxin_tob", displayName: "灵动欣欣 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_linjuayi_tob", displayName: "邻居阿姨 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_tianmeijiaoqiao_tob", displayName: "甜美娇俏 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_qinglenggaoya_tob", displayName: "清冷高雅 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_lixingyuanzi_tob", displayName: "理性圆子 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_xingganmeihuo_tob", displayName: "性感魅惑 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_nuanxinqianqian_tob", displayName: "暖心茜茜 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_nuanxinxuejie_tob", displayName: "暖心学姐 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_qingtianmeimei_tob", displayName: "清甜莓莓 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_qingtiantaotao_tob", displayName: "清甜桃桃 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_qingxixiaoxue_tob", displayName: "清晰小雪 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_qingxinshaonv_tob", displayName: "倾心少女 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_ruanmengtangtang_tob", displayName: "柔骨魂师 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_ruanmengtuanzi_tob", displayName: "软萌团子 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_tianmeihuopo_tob", displayName: "甜美活泼 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_tianmeixiaoju_tob", displayName: "甜美小橘 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_tianmeixiaoyu_tob", displayName: "甜美小雨 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_tiaopigongzhu_tob", displayName: "调皮公主 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_tiexinnvyou_tob", displayName: "贴心女友 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_wenrounvshen_tob", displayName: "温柔女神 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_wenrouwenya_tob", displayName: "温柔文雅 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_zhixinjiejie_tob", displayName: "知心姐姐 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_wumeiyujie_tob", displayName: "妩媚御姐 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_yuanqitianmei_tob", displayName: "元气甜妹 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_xiemeiyujie_tob", displayName: "邪魅御姐 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_xingganyujie_tob", displayName: "性感御姐 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_xiuliqianqian_tob", displayName: "秀丽倩倩 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_tiexinguimi_tob", displayName: "贴心闺蜜 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_tiexinmeimei_tob", displayName: "贴心妹妹 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_wenroubaiyueguang_tob", displayName: "温柔白月光 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_chuliannvyou_tob", displayName: "初恋女友 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_female_zhixingwenwan_tob", displayName: "知性温婉 2.0", gender: "female", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_aoqilingren_tob", displayName: "傲气凌人 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_anrenqinzhu_tob", displayName: "黯刃秦主 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_aojiaogongzi_tob", displayName: "傲娇公子 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_aojiaojingying_tob", displayName: "傲娇精英 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_aomanqingnian_tob", displayName: "傲慢青年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_aomanshaoye_tob", displayName: "傲慢少爷 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_zhenbiandiyu_tob", displayName: "枕边低语 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_badaoshaoye_tob", displayName: "霸道少爷 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_badaozongcai_tob", displayName: "霸道总裁 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_bingjiaobailian_tob", displayName: "病娇白莲 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_bingjiaodidi_tob", displayName: "病娇弟弟 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_bingjiaogege_tob", displayName: "病娇哥哥 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_bingjiaonanyou_tob", displayName: "病娇男友 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_bingjiaoshaonian_tob", displayName: "病娇少年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_bingruogongzi_tob", displayName: "病弱公子 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_bingruoshaonian_tob", displayName: "病弱少年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_bujiqingnian_tob", displayName: "不羁青年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_chunhoudiyin_tob", displayName: "醇厚低音 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_paoxiaoxiaoge_tob", displayName: "咆哮小哥 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_yangyang_tob", displayName: "炀炀 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_chanruoshaoye_tob", displayName: "孱弱少爷 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_chengshuzongcai_tob", displayName: "成熟总裁 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_chenwenmingzai_tob", displayName: "沉稳明仔 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_qingyisugan_tob", displayName: "清逸苏感 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_chunzhenxuedi_tob", displayName: "纯真学弟 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_cixingnansang_tob", displayName: "磁性男嗓 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_cujingnansheng_tob", displayName: "醋精男生 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_cujingnanyou_tob", displayName: "醋精男友 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_diyinchenyu_tob", displayName: "低音沉郁 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_fengfashaonian_tob", displayName: "风发少年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_ruyagongzi_tob", displayName: "儒雅公子 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_fuheigongzi_tob", displayName: "腹黑公子 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_ganjingshaonian_tob", displayName: "干净少年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_gaolengzongcai_tob", displayName: "高冷总裁 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_guaogongzi_tob", displayName: "孤傲公子 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_guiyishenmi_tob", displayName: "aogongzi_to b 诡异神秘 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_guzhibingjiao_tob", displayName: "固执病娇 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_hanhoudunshi_tob", displayName: "憨厚敦实 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_huoliqingnian_tob", displayName: "活力青年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_huoponanyou_tob", displayName: "活泼男友 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_huoposhuanglang_tob", displayName: "活泼爽朗 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_huzishushu_tob", displayName: "胡子叔叔 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_jijiazhineng_tob", displayName: "机甲智能 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_jingyingqingnian_tob", displayName: "精英青年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_junyigongzi_tob", displayName: "俊逸公子 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_kailangqingkuai_tob", displayName: "开朗轻快 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_kailangqingnian_tob", displayName: "开朗青年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_lanyincaohunshi_tob", displayName: "蓝银草魂师 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_lengaozongcai_tob", displayName: "冷傲总裁 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_lengdanshuli_tob", displayName: "冷淡疏离 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_lengjungaozhi_tob", displayName: "冷峻高智 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_lengjunshangsi_tob", displayName: "冷峻上司 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_lengkugege_tob", displayName: "冷酷哥哥 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_lenglianxiongzhang_tob", displayName: "冷脸兄长 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_lenglianxueba_tob", displayName: "冷脸学霸 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_lengmonanyou_tob", displayName: "冷漠男友 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_lengmoxiongzhang_tob", displayName: "冷漠兄长 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_lingyunqingnian_tob", displayName: "凌云青年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_qinglengjingui_tob", displayName: "清冷矜贵 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_lvchaxiaoge_tob", displayName: "绿茶小哥 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_mengdongqingnian_tob", displayName: "懵懂青年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_menyoupingxiaoge_tob", displayName: "闷油瓶小哥 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_xiaozhangxiaoge_tob", displayName: "嚣张小哥 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_nianrennanyou_tob", displayName: "粘人男友 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_neiliancaijun_tob", displayName: "内敛才俊 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_nuanxintitie_tob", displayName: "暖心体贴 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_pianpiangongzi_tob", displayName: "翩翩公子 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_chenwenyouya_tob", displayName: "沉稳优雅 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_qingsexiaosheng_tob", displayName: "青涩小生 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_qingseqingnian_tob", displayName: "青涩青年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_qingshuangshaonian_tob", displayName: "清爽少年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_qingxinbobo_tob", displayName: "清新波波 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_qinqieqingnian_tob", displayName: "亲切青年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_qinqiexiaozhuo_tob", displayName: "亲切小卓 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_qinglangwenrun_tob", displayName: "清朗温润 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_rexueshaonian_tob", displayName: "热血少年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_ruyacaijun_tob", displayName: "儒雅才俊 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_ruyajunzi_tob", displayName: "儒雅君子 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_ruyazongcai_tob", displayName: "儒雅总裁 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_sajiaonansheng_tob", displayName: "撒娇男生 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_sajiaonanyou_tob", displayName: "撒娇男友 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_sajiaonianren_tob", displayName: "撒娇粘人 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_satuoqingnian_tob", displayName: "洒脱青年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_shaonianjiangjun_tob", displayName: "少年将军 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_shenchenzongcai_tob", displayName: "深沉总裁 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_jilingxiaohuo_tob", displayName: "机灵小伙 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_shenmifashi_tob", displayName: "神秘法师 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_shuaizhenxiaohuo_tob", displayName: "率真小伙 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_shuanglangxiaoyang_tob", displayName: "爽朗小阳 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_dichenqianquan_tob", displayName: "低沉缱绻 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_siwenqingnian_tob", displayName: "斯文青年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_tianxinanyou_tob", displayName: "甜系男友 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_tiexinnanyou_tob", displayName: "贴心男友 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_wenrounantongzhuo_tob", displayName: "温柔男同桌 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_wenrounanyou_tob", displayName: "温柔男友 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_wenrouxuezhang_tob", displayName: "温柔学长 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_wenrunxuezhe_tob", displayName: "温润学者 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_wenshunshaonian_tob", displayName: "温顺少年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_guayanxiaoge_tob", displayName: "寡言小哥 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_xiaohouye_tob", displayName: "小侯爷 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_naiqixiaosheng_tob", displayName: "奶气小生 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_xiaosasuixing_tob", displayName: "潇洒随性 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_wenrouneilian_tob", displayName: "温柔内敛 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_xuebanantongzhuo_tob", displayName: "学霸男同桌 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_xuebatongzhuo_tob", displayName: "学霸同桌 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_yangguangyangyang_tob", displayName: "阳光洋洋 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_wennuanshaonian_tob", displayName: "温暖少年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_yiqishaonian_tob", displayName: "意气少年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_younidashu_tob", displayName: "油腻大叔 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_youmodaye_tob", displayName: "幽默大爷 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_youmoshushu_tob", displayName: "幽默叔叔 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_youroubangzhu_tob", displayName: "优柔帮主 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_yourougongzi_tob", displayName: "优柔公子 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_yuanqishaonian_tob", displayName: "元气少年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_zhangjianjunzi_tob", displayName: "仗剑君子 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_zhangjianxiake_tob", displayName: "仗剑侠客 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_zhengzhiqingnian_tob", displayName: "正直青年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_zhishuaiqingnian_tob", displayName: "直率青年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_zhongerqingnian_tob", displayName: "中二青年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_zifuqingnian_tob", displayName: "自负青年 2.0", gender: "male", locale: "zh-CN" },
    { name: "ICL_uranus_zh_male_zixinqingnian_tob", displayName: "自信青年 2.0", gender: "male", locale: "zh-CN" },
];
const getTTSVoice = async (config) => {
    return Promise.resolve(VOICES_2_0.map((voice) => ({
        name: voice.name,
        gender: voice.gender,
        locale: voice.locale,
        displayName: `Volcengine TTS - ${voice.displayName} (${voice.locale})`,
        plugin: "volcengine-tts-voice-plugin",
        config: {
            ...config,
            voiceName: voice.name,
        },
    })));
};

module.exports = { getAudioPath, getTTSVoice };
