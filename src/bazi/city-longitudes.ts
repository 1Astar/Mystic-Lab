/** 国内城市经度（东经），用于真太阳时粗校正。
 * 数据源：public-wheels/china-cities（和风天气城市表，含地级+县级）。
 * 同名且经度差>0.8° 的歧义地名已剔除；长安→西安 等常用别名见 aliases。
 * 重新生成：node scripts/generate-city-longitudes.mjs [china_cities.json]
 */
export type CityLng = { name: string; aliases: string[]; lng: number };

export const CITY_LONGITUDES: CityLng[] = [
  {
    name: '阿巴嘎',
    aliases: [
      '阿巴嘎'
    ],
    lng: 114.97
  },
  {
    name: '阿坝',
    aliases: [
      '阿坝'
    ],
    lng: 102.22
  },
  {
    name: '阿城',
    aliases: [
      '阿城'
    ],
    lng: 126.97
  },
  {
    name: '阿尔山',
    aliases: [
      '阿尔山'
    ],
    lng: 119.94
  },
  {
    name: '阿合奇',
    aliases: [
      '阿合奇'
    ],
    lng: 78.45
  },
  {
    name: '阿克塞',
    aliases: [
      '阿克塞'
    ],
    lng: 94.34
  },
  {
    name: '阿克苏',
    aliases: [
      '阿克苏'
    ],
    lng: 80.27
  },
  {
    name: '阿克陶',
    aliases: [
      '阿克陶'
    ],
    lng: 75.95
  },
  {
    name: '阿拉尔',
    aliases: [
      '阿拉尔'
    ],
    lng: 81.29
  },
  {
    name: '阿拉山口',
    aliases: [
      '阿拉山口'
    ],
    lng: 82.57
  },
  {
    name: '阿拉善盟',
    aliases: [
      '阿拉善盟'
    ],
    lng: 105.71
  },
  {
    name: '阿勒泰',
    aliases: [
      '阿勒泰'
    ],
    lng: 88.14
  },
  {
    name: '阿里',
    aliases: [
      '阿里'
    ],
    lng: 80.11
  },
  {
    name: '阿鲁旗',
    aliases: [
      '阿鲁旗'
    ],
    lng: 120.03
  },
  {
    name: '阿荣旗',
    aliases: [
      '阿荣旗'
    ],
    lng: 123.46
  },
  {
    name: '阿图什',
    aliases: [
      '阿图什'
    ],
    lng: 76.17
  },
  {
    name: '阿瓦提',
    aliases: [
      '阿瓦提'
    ],
    lng: 80.38
  },
  {
    name: '阿右旗',
    aliases: [
      '阿右旗'
    ],
    lng: 101.41
  },
  {
    name: '阿左旗',
    aliases: [
      '阿左旗'
    ],
    lng: 105.11
  },
  {
    name: '爱辉',
    aliases: [
      '爱辉'
    ],
    lng: 127.5
  },
  {
    name: '爱民',
    aliases: [
      '爱民'
    ],
    lng: 129.6
  },
  {
    name: '安次',
    aliases: [
      '安次'
    ],
    lng: 116.69
  },
  {
    name: '安达',
    aliases: [
      '安达'
    ],
    lng: 125.33
  },
  {
    name: '安定',
    aliases: [
      '安定'
    ],
    lng: 104.63
  },
  {
    name: '安多',
    aliases: [
      '安多'
    ],
    lng: 91.68
  },
  {
    name: '安福',
    aliases: [
      '安福'
    ],
    lng: 114.61
  },
  {
    name: '安国',
    aliases: [
      '安国'
    ],
    lng: 115.33
  },
  {
    name: '安化',
    aliases: [
      '安化'
    ],
    lng: 111.22
  },
  {
    name: '安吉',
    aliases: [
      '安吉'
    ],
    lng: 119.69
  },
  {
    name: '安居',
    aliases: [
      '安居'
    ],
    lng: 105.46
  },
  {
    name: '安康',
    aliases: [
      '安康'
    ],
    lng: 109.03
  },
  {
    name: '安龙',
    aliases: [
      '安龙'
    ],
    lng: 105.47
  },
  {
    name: '安陆',
    aliases: [
      '安陆'
    ],
    lng: 113.69
  },
  {
    name: '安平',
    aliases: [
      '安平'
    ],
    lng: 115.52
  },
  {
    name: '安庆',
    aliases: [
      '安庆'
    ],
    lng: 117.04
  },
  {
    name: '安丘',
    aliases: [
      '安丘'
    ],
    lng: 119.21
  },
  {
    name: '安仁',
    aliases: [
      '安仁'
    ],
    lng: 113.27
  },
  {
    name: '安塞',
    aliases: [
      '安塞'
    ],
    lng: 109.33
  },
  {
    name: '安顺',
    aliases: [
      '安顺'
    ],
    lng: 105.93
  },
  {
    name: '安图',
    aliases: [
      '安图'
    ],
    lng: 128.9
  },
  {
    name: '安溪',
    aliases: [
      '安溪'
    ],
    lng: 118.19
  },
  {
    name: '安县',
    aliases: [
      '安县'
    ],
    lng: 104.25
  },
  {
    name: '安乡',
    aliases: [
      '安乡'
    ],
    lng: 112.17
  },
  {
    name: '安新',
    aliases: [
      '安新'
    ],
    lng: 115.93
  },
  {
    name: '安阳',
    aliases: [
      '安阳'
    ],
    lng: 114.35
  },
  {
    name: '安义',
    aliases: [
      '安义'
    ],
    lng: 115.55
  },
  {
    name: '安源',
    aliases: [
      '安源'
    ],
    lng: 113.86
  },
  {
    name: '安远',
    aliases: [
      '安远'
    ],
    lng: 115.39
  },
  {
    name: '安岳',
    aliases: [
      '安岳'
    ],
    lng: 105.34
  },
  {
    name: '安泽',
    aliases: [
      '安泽'
    ],
    lng: 112.25
  },
  {
    name: '安州',
    aliases: [
      '安州'
    ],
    lng: 104.56
  },
  {
    name: '鞍山',
    aliases: [
      '鞍山'
    ],
    lng: 123
  },
  {
    name: '昂昂溪',
    aliases: [
      '昂昂溪'
    ],
    lng: 123.81
  },
  {
    name: '昂仁',
    aliases: [
      '昂仁'
    ],
    lng: 87.24
  },
  {
    name: '敖汉',
    aliases: [
      '敖汉'
    ],
    lng: 119.91
  },
  {
    name: '澳门',
    aliases: [
      '澳门'
    ],
    lng: 113.54
  },
  {
    name: '八步',
    aliases: [
      '八步'
    ],
    lng: 111.55
  },
  {
    name: '八公山',
    aliases: [
      '八公山'
    ],
    lng: 116.84
  },
  {
    name: '八宿',
    aliases: [
      '八宿'
    ],
    lng: 96.92
  },
  {
    name: '巴楚',
    aliases: [
      '巴楚'
    ],
    lng: 78.55
  },
  {
    name: '巴东',
    aliases: [
      '巴东'
    ],
    lng: 110.34
  },
  {
    name: '巴里坤',
    aliases: [
      '巴里坤'
    ],
    lng: 93.02
  },
  {
    name: '巴林右旗',
    aliases: [
      '巴林右旗'
    ],
    lng: 118.68
  },
  {
    name: '巴林左旗',
    aliases: [
      '巴林左旗'
    ],
    lng: 119.39
  },
  {
    name: '巴马',
    aliases: [
      '巴马'
    ],
    lng: 107.25
  },
  {
    name: '巴南',
    aliases: [
      '巴南'
    ],
    lng: 106.52
  },
  {
    name: '巴青',
    aliases: [
      '巴青'
    ],
    lng: 94.05
  },
  {
    name: '巴塘',
    aliases: [
      '巴塘'
    ],
    lng: 99.11
  },
  {
    name: '巴彦',
    aliases: [
      '巴彦'
    ],
    lng: 127.4
  },
  {
    name: '巴彦淖尔',
    aliases: [
      '巴彦淖尔'
    ],
    lng: 107.42
  },
  {
    name: '巴宜',
    aliases: [
      '巴宜'
    ],
    lng: 94.36
  },
  {
    name: '巴音郭楞',
    aliases: [
      '巴音郭楞'
    ],
    lng: 86.15
  },
  {
    name: '巴中',
    aliases: [
      '巴中'
    ],
    lng: 106.75
  },
  {
    name: '巴州',
    aliases: [
      '巴州'
    ],
    lng: 106.75
  },
  {
    name: '鲅鱼圈',
    aliases: [
      '鲅鱼圈'
    ],
    lng: 122.13
  },
  {
    name: '霸州',
    aliases: [
      '霸州'
    ],
    lng: 116.39
  },
  {
    name: '灞桥',
    aliases: [
      '灞桥'
    ],
    lng: 109.07
  },
  {
    name: '白城',
    aliases: [
      '白城'
    ],
    lng: 122.84
  },
  {
    name: '白河',
    aliases: [
      '白河'
    ],
    lng: 110.11
  },
  {
    name: '白碱滩',
    aliases: [
      '白碱滩'
    ],
    lng: 85.13
  },
  {
    name: '白朗',
    aliases: [
      '白朗'
    ],
    lng: 89.26
  },
  {
    name: '白沙',
    aliases: [
      '白沙'
    ],
    lng: 109.45
  },
  {
    name: '白山',
    aliases: [
      '白山'
    ],
    lng: 126.43
  },
  {
    name: '白水',
    aliases: [
      '白水'
    ],
    lng: 109.59
  },
  {
    name: '白塔',
    aliases: [
      '白塔'
    ],
    lng: 123.17
  },
  {
    name: '白银',
    aliases: [
      '白银'
    ],
    lng: 104.17
  },
  {
    name: '白玉',
    aliases: [
      '白玉'
    ],
    lng: 98.82
  },
  {
    name: '白云鄂博',
    aliases: [
      '白云鄂博'
    ],
    lng: 109.97
  },
  {
    name: '百色',
    aliases: [
      '百色'
    ],
    lng: 106.62
  },
  {
    name: '柏乡',
    aliases: [
      '柏乡'
    ],
    lng: 114.69
  },
  {
    name: '拜城',
    aliases: [
      '拜城'
    ],
    lng: 81.87
  },
  {
    name: '拜泉',
    aliases: [
      '拜泉'
    ],
    lng: 126.09
  },
  {
    name: '班戈',
    aliases: [
      '班戈'
    ],
    lng: 90.01
  },
  {
    name: '班玛',
    aliases: [
      '班玛'
    ],
    lng: 100.74
  },
  {
    name: '蚌埠',
    aliases: [
      '蚌埠'
    ],
    lng: 117.36
  },
  {
    name: '蚌山',
    aliases: [
      '蚌山'
    ],
    lng: 117.36
  },
  {
    name: '包河',
    aliases: [
      '包河'
    ],
    lng: 117.29
  },
  {
    name: '包头',
    aliases: [
      '包头'
    ],
    lng: 109.84
  },
  {
    name: '宝安',
    aliases: [
      '宝安'
    ],
    lng: 113.83
  },
  {
    name: '宝坻',
    aliases: [
      '宝坻'
    ],
    lng: 117.31
  },
  {
    name: '宝丰',
    aliases: [
      '宝丰'
    ],
    lng: 113.07
  },
  {
    name: '宝鸡',
    aliases: [
      '宝鸡'
    ],
    lng: 107.14
  },
  {
    name: '宝清',
    aliases: [
      '宝清'
    ],
    lng: 132.21
  },
  {
    name: '宝塔',
    aliases: [
      '宝塔'
    ],
    lng: 109.49
  },
  {
    name: '宝兴',
    aliases: [
      '宝兴'
    ],
    lng: 102.81
  },
  {
    name: '宝应',
    aliases: [
      '宝应'
    ],
    lng: 119.32
  },
  {
    name: '保德',
    aliases: [
      '保德'
    ],
    lng: 111.09
  },
  {
    name: '保定',
    aliases: [
      '保定'
    ],
    lng: 115.48
  },
  {
    name: '保靖',
    aliases: [
      '保靖'
    ],
    lng: 109.65
  },
  {
    name: '保康',
    aliases: [
      '保康'
    ],
    lng: 111.26
  },
  {
    name: '保山',
    aliases: [
      '保山'
    ],
    lng: 99.17
  },
  {
    name: '保亭',
    aliases: [
      '保亭'
    ],
    lng: 109.7
  },
  {
    name: '碑林',
    aliases: [
      '碑林'
    ],
    lng: 108.95
  },
  {
    name: '北安',
    aliases: [
      '北安'
    ],
    lng: 126.51
  },
  {
    name: '北碚',
    aliases: [
      '北碚'
    ],
    lng: 106.44
  },
  {
    name: '北辰',
    aliases: [
      '北辰'
    ],
    lng: 117.13
  },
  {
    name: '北川',
    aliases: [
      '北川'
    ],
    lng: 104.47
  },
  {
    name: '北戴河',
    aliases: [
      '北戴河'
    ],
    lng: 119.49
  },
  {
    name: '北关',
    aliases: [
      '北关'
    ],
    lng: 114.35
  },
  {
    name: '北海',
    aliases: [
      '北海'
    ],
    lng: 109.12
  },
  {
    name: '北湖',
    aliases: [
      '北湖'
    ],
    lng: 113.03
  },
  {
    name: '北京',
    aliases: [
      '北京',
      '北平'
    ],
    lng: 116.41
  },
  {
    name: '北林',
    aliases: [
      '北林'
    ],
    lng: 126.99
  },
  {
    name: '北流',
    aliases: [
      '北流'
    ],
    lng: 110.35
  },
  {
    name: '北仑',
    aliases: [
      '北仑'
    ],
    lng: 121.83
  },
  {
    name: '北票',
    aliases: [
      '北票'
    ],
    lng: 120.77
  },
  {
    name: '北塔',
    aliases: [
      '北塔'
    ],
    lng: 111.45
  },
  {
    name: '北屯',
    aliases: [
      '北屯'
    ],
    lng: 87.82
  },
  {
    name: '北镇',
    aliases: [
      '北镇'
    ],
    lng: 121.8
  },
  {
    name: '本溪',
    aliases: [
      '本溪'
    ],
    lng: 123.77
  },
  {
    name: '本溪县',
    aliases: [
      '本溪县'
    ],
    lng: 124.17
  },
  {
    name: '比如',
    aliases: [
      '比如'
    ],
    lng: 93.68
  },
  {
    name: '毕节',
    aliases: [
      '毕节'
    ],
    lng: 105.29
  },
  {
    name: '碧江',
    aliases: [
      '碧江'
    ],
    lng: 109.19
  },
  {
    name: '璧山',
    aliases: [
      '璧山'
    ],
    lng: 106.23
  },
  {
    name: '边坝',
    aliases: [
      '边坝'
    ],
    lng: 94.71
  },
  {
    name: '宾川',
    aliases: [
      '宾川'
    ],
    lng: 100.58
  },
  {
    name: '宾县',
    aliases: [
      '宾县'
    ],
    lng: 127.49
  },
  {
    name: '宾阳',
    aliases: [
      '宾阳'
    ],
    lng: 108.82
  },
  {
    name: '彬县',
    aliases: [
      '彬县'
    ],
    lng: 108.08
  },
  {
    name: '滨城',
    aliases: [
      '滨城'
    ],
    lng: 118.02
  },
  {
    name: '滨海',
    aliases: [
      '滨海'
    ],
    lng: 119.83
  },
  {
    name: '滨海新区',
    aliases: [
      '滨海新区'
    ],
    lng: 117.65
  },
  {
    name: '滨湖',
    aliases: [
      '滨湖'
    ],
    lng: 120.27
  },
  {
    name: '滨江',
    aliases: [
      '滨江'
    ],
    lng: 120.21
  },
  {
    name: '滨州',
    aliases: [
      '滨州'
    ],
    lng: 118.02
  },
  {
    name: '波密',
    aliases: [
      '波密'
    ],
    lng: 95.77
  },
  {
    name: '播州',
    aliases: [
      '播州'
    ],
    lng: 106.83
  },
  {
    name: '勃利',
    aliases: [
      '勃利'
    ],
    lng: 130.58
  },
  {
    name: '亳州',
    aliases: [
      '亳州'
    ],
    lng: 115.78
  },
  {
    name: '博爱',
    aliases: [
      '博爱'
    ],
    lng: 113.07
  },
  {
    name: '博白',
    aliases: [
      '博白'
    ],
    lng: 109.98
  },
  {
    name: '博尔塔拉',
    aliases: [
      '博尔塔拉'
    ],
    lng: 82.07
  },
  {
    name: '博湖',
    aliases: [
      '博湖'
    ],
    lng: 86.63
  },
  {
    name: '博乐',
    aliases: [
      '博乐'
    ],
    lng: 82.07
  },
  {
    name: '博罗',
    aliases: [
      '博罗'
    ],
    lng: 114.28
  },
  {
    name: '博山',
    aliases: [
      '博山'
    ],
    lng: 117.86
  },
  {
    name: '博望',
    aliases: [
      '博望'
    ],
    lng: 118.84
  },
  {
    name: '博兴',
    aliases: [
      '博兴'
    ],
    lng: 118.12
  },
  {
    name: '博野',
    aliases: [
      '博野'
    ],
    lng: 115.46
  },
  {
    name: '布尔津',
    aliases: [
      '布尔津'
    ],
    lng: 86.86
  },
  {
    name: '布拖',
    aliases: [
      '布拖'
    ],
    lng: 102.81
  },
  {
    name: '蔡甸',
    aliases: [
      '蔡甸'
    ],
    lng: 114.03
  },
  {
    name: '仓山',
    aliases: [
      '仓山'
    ],
    lng: 119.32
  },
  {
    name: '沧县',
    aliases: [
      '沧县'
    ],
    lng: 117.01
  },
  {
    name: '沧源',
    aliases: [
      '沧源'
    ],
    lng: 99.25
  },
  {
    name: '沧州',
    aliases: [
      '沧州'
    ],
    lng: 116.86
  },
  {
    name: '苍南',
    aliases: [
      '苍南'
    ],
    lng: 120.41
  },
  {
    name: '苍梧',
    aliases: [
      '苍梧'
    ],
    lng: 111.54
  },
  {
    name: '苍溪',
    aliases: [
      '苍溪'
    ],
    lng: 105.94
  },
  {
    name: '曹妃甸',
    aliases: [
      '曹妃甸'
    ],
    lng: 118.45
  },
  {
    name: '曹县',
    aliases: [
      '曹县'
    ],
    lng: 115.55
  },
  {
    name: '册亨',
    aliases: [
      '册亨'
    ],
    lng: 105.81
  },
  {
    name: '策勒',
    aliases: [
      '策勒'
    ],
    lng: 80.8
  },
  {
    name: '岑巩',
    aliases: [
      '岑巩'
    ],
    lng: 108.82
  },
  {
    name: '岑溪',
    aliases: [
      '岑溪'
    ],
    lng: 111
  },
  {
    name: '曾都',
    aliases: [
      '曾都'
    ],
    lng: 113.37
  },
  {
    name: '茶陵',
    aliases: [
      '茶陵'
    ],
    lng: 113.55
  },
  {
    name: '察布查尔',
    aliases: [
      '察布查尔'
    ],
    lng: 81.15
  },
  {
    name: '察雅',
    aliases: [
      '察雅'
    ],
    lng: 97.57
  },
  {
    name: '察右后旗',
    aliases: [
      '察右后旗'
    ],
    lng: 113.11
  },
  {
    name: '察右前旗',
    aliases: [
      '察右前旗'
    ],
    lng: 113.13
  },
  {
    name: '察右中旗',
    aliases: [
      '察右中旗'
    ],
    lng: 112.37
  },
  {
    name: '察隅',
    aliases: [
      '察隅'
    ],
    lng: 97.47
  },
  {
    name: '禅城',
    aliases: [
      '禅城'
    ],
    lng: 113.11
  },
  {
    name: '瀍河',
    aliases: [
      '瀍河'
    ],
    lng: 112.49
  },
  {
    name: '昌都',
    aliases: [
      '昌都'
    ],
    lng: 97.18
  },
  {
    name: '昌吉',
    aliases: [
      '昌吉'
    ],
    lng: 87.3
  },
  {
    name: '昌乐',
    aliases: [
      '昌乐'
    ],
    lng: 118.84
  },
  {
    name: '昌黎',
    aliases: [
      '昌黎'
    ],
    lng: 119.16
  },
  {
    name: '昌宁',
    aliases: [
      '昌宁'
    ],
    lng: 99.61
  },
  {
    name: '昌平',
    aliases: [
      '昌平'
    ],
    lng: 116.24
  },
  {
    name: '昌图',
    aliases: [
      '昌图'
    ],
    lng: 124.11
  },
  {
    name: '常德',
    aliases: [
      '常德'
    ],
    lng: 111.69
  },
  {
    name: '常宁',
    aliases: [
      '常宁'
    ],
    lng: 112.4
  },
  {
    name: '常山',
    aliases: [
      '常山'
    ],
    lng: 118.52
  },
  {
    name: '常熟',
    aliases: [
      '常熟'
    ],
    lng: 120.75
  },
  {
    name: '常州',
    aliases: [
      '常州'
    ],
    lng: 119.95
  },
  {
    name: '巢湖',
    aliases: [
      '巢湖'
    ],
    lng: 117.87
  },
  {
    name: '朝天',
    aliases: [
      '朝天'
    ],
    lng: 105.89
  },
  {
    name: '潮安',
    aliases: [
      '潮安'
    ],
    lng: 116.68
  },
  {
    name: '潮南',
    aliases: [
      '潮南'
    ],
    lng: 116.42
  },
  {
    name: '潮阳',
    aliases: [
      '潮阳'
    ],
    lng: 116.6
  },
  {
    name: '潮州',
    aliases: [
      '潮州'
    ],
    lng: 116.63
  },
  {
    name: '郴州',
    aliases: [
      '郴州'
    ],
    lng: 113.03
  },
  {
    name: '辰溪',
    aliases: [
      '辰溪'
    ],
    lng: 110.2
  },
  {
    name: '陈仓',
    aliases: [
      '陈仓'
    ],
    lng: 107.38
  },
  {
    name: '陈旗',
    aliases: [
      '陈旗'
    ],
    lng: 119.26
  },
  {
    name: '称多',
    aliases: [
      '称多'
    ],
    lng: 97.11
  },
  {
    name: '成安',
    aliases: [
      '成安'
    ],
    lng: 114.68
  },
  {
    name: '成都',
    aliases: [
      '成都'
    ],
    lng: 104.07
  },
  {
    name: '成华',
    aliases: [
      '成华'
    ],
    lng: 104.1
  },
  {
    name: '成武',
    aliases: [
      '成武'
    ],
    lng: 115.9
  },
  {
    name: '成县',
    aliases: [
      '成县'
    ],
    lng: 105.73
  },
  {
    name: '呈贡',
    aliases: [
      '呈贡'
    ],
    lng: 102.8
  },
  {
    name: '承德',
    aliases: [
      '承德'
    ],
    lng: 117.94
  },
  {
    name: '承德县',
    aliases: [
      '承德县'
    ],
    lng: 118.17
  },
  {
    name: '城北',
    aliases: [
      '城北'
    ],
    lng: 101.76
  },
  {
    name: '城步',
    aliases: [
      '城步'
    ],
    lng: 110.31
  },
  {
    name: '城东',
    aliases: [
      '城东'
    ],
    lng: 101.8
  },
  {
    name: '城固',
    aliases: [
      '城固'
    ],
    lng: 107.33
  },
  {
    name: '城口',
    aliases: [
      '城口'
    ],
    lng: 108.66
  },
  {
    name: '城西',
    aliases: [
      '城西'
    ],
    lng: 101.76
  },
  {
    name: '城厢',
    aliases: [
      '城厢'
    ],
    lng: 119
  },
  {
    name: '城阳',
    aliases: [
      '城阳'
    ],
    lng: 120.39
  },
  {
    name: '城子河',
    aliases: [
      '城子河'
    ],
    lng: 131.01
  },
  {
    name: '澄城',
    aliases: [
      '澄城'
    ],
    lng: 109.94
  },
  {
    name: '澄海',
    aliases: [
      '澄海'
    ],
    lng: 116.76
  },
  {
    name: '澄江',
    aliases: [
      '澄江'
    ],
    lng: 102.92
  },
  {
    name: '澄迈',
    aliases: [
      '澄迈'
    ],
    lng: 110.01
  },
  {
    name: '池州',
    aliases: [
      '池州'
    ],
    lng: 117.49
  },
  {
    name: '茌平',
    aliases: [
      '茌平'
    ],
    lng: 116.25
  },
  {
    name: '赤壁',
    aliases: [
      '赤壁'
    ],
    lng: 113.88
  },
  {
    name: '赤城',
    aliases: [
      '赤城'
    ],
    lng: 115.83
  },
  {
    name: '赤峰',
    aliases: [
      '赤峰'
    ],
    lng: 118.96
  },
  {
    name: '赤坎',
    aliases: [
      '赤坎'
    ],
    lng: 110.36
  },
  {
    name: '赤水',
    aliases: [
      '赤水'
    ],
    lng: 105.7
  },
  {
    name: '重庆',
    aliases: [
      '重庆'
    ],
    lng: 106.55
  },
  {
    name: '崇川',
    aliases: [
      '崇川'
    ],
    lng: 120.87
  },
  {
    name: '崇礼',
    aliases: [
      '崇礼'
    ],
    lng: 115.28
  },
  {
    name: '崇明',
    aliases: [
      '崇明'
    ],
    lng: 121.4
  },
  {
    name: '崇仁',
    aliases: [
      '崇仁'
    ],
    lng: 116.06
  },
  {
    name: '崇信',
    aliases: [
      '崇信'
    ],
    lng: 107.03
  },
  {
    name: '崇阳',
    aliases: [
      '崇阳'
    ],
    lng: 114.05
  },
  {
    name: '崇义',
    aliases: [
      '崇义'
    ],
    lng: 114.31
  },
  {
    name: '崇州',
    aliases: [
      '崇州'
    ],
    lng: 103.67
  },
  {
    name: '崇左',
    aliases: [
      '崇左'
    ],
    lng: 107.35
  },
  {
    name: '滁州',
    aliases: [
      '滁州'
    ],
    lng: 118.32
  },
  {
    name: '楚雄',
    aliases: [
      '楚雄'
    ],
    lng: 101.55
  },
  {
    name: '川汇',
    aliases: [
      '川汇'
    ],
    lng: 114.65
  },
  {
    name: '船山',
    aliases: [
      '船山'
    ],
    lng: 105.58
  },
  {
    name: '船营',
    aliases: [
      '船营'
    ],
    lng: 126.55
  },
  {
    name: '淳安',
    aliases: [
      '淳安'
    ],
    lng: 119.04
  },
  {
    name: '淳化',
    aliases: [
      '淳化'
    ],
    lng: 108.58
  },
  {
    name: '慈利',
    aliases: [
      '慈利'
    ],
    lng: 111.13
  },
  {
    name: '慈溪',
    aliases: [
      '慈溪'
    ],
    lng: 121.25
  },
  {
    name: '磁县',
    aliases: [
      '磁县'
    ],
    lng: 114.38
  },
  {
    name: '枞阳',
    aliases: [
      '枞阳'
    ],
    lng: 117.22
  },
  {
    name: '从化',
    aliases: [
      '从化'
    ],
    lng: 113.59
  },
  {
    name: '从江',
    aliases: [
      '从江'
    ],
    lng: 108.91
  },
  {
    name: '丛台',
    aliases: [
      '丛台'
    ],
    lng: 114.49
  },
  {
    name: '翠峦',
    aliases: [
      '翠峦'
    ],
    lng: 128.67
  },
  {
    name: '翠屏',
    aliases: [
      '翠屏'
    ],
    lng: 104.63
  },
  {
    name: '措美',
    aliases: [
      '措美'
    ],
    lng: 91.43
  },
  {
    name: '措勤',
    aliases: [
      '措勤'
    ],
    lng: 85.16
  },
  {
    name: '错那',
    aliases: [
      '错那'
    ],
    lng: 91.96
  },
  {
    name: '达坂城',
    aliases: [
      '达坂城'
    ],
    lng: 88.31
  },
  {
    name: '达川',
    aliases: [
      '达川'
    ],
    lng: 107.51
  },
  {
    name: '达拉特',
    aliases: [
      '达拉特'
    ],
    lng: 110.04
  },
  {
    name: '达茂旗',
    aliases: [
      '达茂旗'
    ],
    lng: 110.26
  },
  {
    name: '达日',
    aliases: [
      '达日'
    ],
    lng: 99.65
  },
  {
    name: '达州',
    aliases: [
      '达州'
    ],
    lng: 107.5
  },
  {
    name: '达孜',
    aliases: [
      '达孜'
    ],
    lng: 91.35
  },
  {
    name: '大埔',
    aliases: [
      '大埔'
    ],
    lng: 116.7
  },
  {
    name: '大柴旦',
    aliases: [
      '大柴旦'
    ],
    lng: 95.22
  },
  {
    name: '大厂',
    aliases: [
      '大厂'
    ],
    lng: 116.99
  },
  {
    name: '大城',
    aliases: [
      '大城'
    ],
    lng: 116.64
  },
  {
    name: '大东',
    aliases: [
      '大东'
    ],
    lng: 123.47
  },
  {
    name: '大渡口',
    aliases: [
      '大渡口'
    ],
    lng: 106.49
  },
  {
    name: '大方',
    aliases: [
      '大方'
    ],
    lng: 105.61
  },
  {
    name: '大丰',
    aliases: [
      '大丰'
    ],
    lng: 120.47
  },
  {
    name: '大关',
    aliases: [
      '大关'
    ],
    lng: 103.89
  },
  {
    name: '大观',
    aliases: [
      '大观'
    ],
    lng: 117.03
  },
  {
    name: '大化',
    aliases: [
      '大化'
    ],
    lng: 107.99
  },
  {
    name: '大理',
    aliases: [
      '大理'
    ],
    lng: 100.23
  },
  {
    name: '大荔',
    aliases: [
      '大荔'
    ],
    lng: 109.94
  },
  {
    name: '大连',
    aliases: [
      '大连'
    ],
    lng: 121.62
  },
  {
    name: '大名',
    aliases: [
      '大名'
    ],
    lng: 115.15
  },
  {
    name: '大宁',
    aliases: [
      '大宁'
    ],
    lng: 110.75
  },
  {
    name: '大庆',
    aliases: [
      '大庆'
    ],
    lng: 125.11
  },
  {
    name: '大石桥',
    aliases: [
      '大石桥'
    ],
    lng: 122.51
  },
  {
    name: '大田',
    aliases: [
      '大田'
    ],
    lng: 117.85
  },
  {
    name: '大同县',
    aliases: [
      '大同县'
    ],
    lng: 113.61
  },
  {
    name: '大洼',
    aliases: [
      '大洼'
    ],
    lng: 122.07
  },
  {
    name: '大武口',
    aliases: [
      '大武口'
    ],
    lng: 106.38
  },
  {
    name: '大悟',
    aliases: [
      '大悟'
    ],
    lng: 114.13
  },
  {
    name: '大祥',
    aliases: [
      '大祥'
    ],
    lng: 111.46
  },
  {
    name: '大新',
    aliases: [
      '大新'
    ],
    lng: 107.2
  },
  {
    name: '大兴',
    aliases: [
      '大兴'
    ],
    lng: 116.34
  },
  {
    name: '大兴安岭',
    aliases: [
      '大兴安岭'
    ],
    lng: 124.71
  },
  {
    name: '大姚',
    aliases: [
      '大姚'
    ],
    lng: 101.32
  },
  {
    name: '大冶',
    aliases: [
      '大冶'
    ],
    lng: 114.97
  },
  {
    name: '大邑',
    aliases: [
      '大邑'
    ],
    lng: 103.52
  },
  {
    name: '大英',
    aliases: [
      '大英'
    ],
    lng: 105.25
  },
  {
    name: '大余',
    aliases: [
      '大余'
    ],
    lng: 114.36
  },
  {
    name: '大竹',
    aliases: [
      '大竹'
    ],
    lng: 107.21
  },
  {
    name: '大足',
    aliases: [
      '大足'
    ],
    lng: 105.72
  },
  {
    name: '代县',
    aliases: [
      '代县'
    ],
    lng: 112.96
  },
  {
    name: '岱山',
    aliases: [
      '岱山'
    ],
    lng: 122.2
  },
  {
    name: '岱岳',
    aliases: [
      '岱岳'
    ],
    lng: 117.04
  },
  {
    name: '带岭',
    aliases: [
      '带岭'
    ],
    lng: 129.02
  },
  {
    name: '丹巴',
    aliases: [
      '丹巴'
    ],
    lng: 101.89
  },
  {
    name: '丹东',
    aliases: [
      '丹东'
    ],
    lng: 124.38
  },
  {
    name: '丹凤',
    aliases: [
      '丹凤'
    ],
    lng: 110.33
  },
  {
    name: '丹江口',
    aliases: [
      '丹江口'
    ],
    lng: 111.51
  },
  {
    name: '丹棱',
    aliases: [
      '丹棱'
    ],
    lng: 103.52
  },
  {
    name: '丹徒',
    aliases: [
      '丹徒'
    ],
    lng: 119.43
  },
  {
    name: '丹阳',
    aliases: [
      '丹阳'
    ],
    lng: 119.58
  },
  {
    name: '丹寨',
    aliases: [
      '丹寨'
    ],
    lng: 107.79
  },
  {
    name: '单县',
    aliases: [
      '单县'
    ],
    lng: 116.08
  },
  {
    name: '郸城',
    aliases: [
      '郸城'
    ],
    lng: 115.19
  },
  {
    name: '儋州',
    aliases: [
      '儋州'
    ],
    lng: 109.58
  },
  {
    name: '当涂',
    aliases: [
      '当涂'
    ],
    lng: 118.49
  },
  {
    name: '当雄',
    aliases: [
      '当雄'
    ],
    lng: 91.1
  },
  {
    name: '当阳',
    aliases: [
      '当阳'
    ],
    lng: 111.79
  },
  {
    name: '氹仔岛',
    aliases: [
      '氹仔岛'
    ],
    lng: 113.54
  },
  {
    name: '宕昌',
    aliases: [
      '宕昌'
    ],
    lng: 104.39
  },
  {
    name: '砀山',
    aliases: [
      '砀山'
    ],
    lng: 116.35
  },
  {
    name: '道孚',
    aliases: [
      '道孚'
    ],
    lng: 101.12
  },
  {
    name: '道里',
    aliases: [
      '道里'
    ],
    lng: 126.61
  },
  {
    name: '道外',
    aliases: [
      '道外'
    ],
    lng: 126.65
  },
  {
    name: '道县',
    aliases: [
      '道县'
    ],
    lng: 111.59
  },
  {
    name: '道真',
    aliases: [
      '道真'
    ],
    lng: 107.61
  },
  {
    name: '稻城',
    aliases: [
      '稻城'
    ],
    lng: 100.3
  },
  {
    name: '得荣',
    aliases: [
      '得荣'
    ],
    lng: 99.29
  },
  {
    name: '德安',
    aliases: [
      '德安'
    ],
    lng: 115.76
  },
  {
    name: '德保',
    aliases: [
      '德保'
    ],
    lng: 106.62
  },
  {
    name: '德昌',
    aliases: [
      '德昌'
    ],
    lng: 102.18
  },
  {
    name: '德城',
    aliases: [
      '德城'
    ],
    lng: 116.31
  },
  {
    name: '德格',
    aliases: [
      '德格'
    ],
    lng: 98.58
  },
  {
    name: '德宏',
    aliases: [
      '德宏'
    ],
    lng: 98.58
  },
  {
    name: '德化',
    aliases: [
      '德化'
    ],
    lng: 118.24
  },
  {
    name: '德惠',
    aliases: [
      '德惠'
    ],
    lng: 125.7
  },
  {
    name: '德江',
    aliases: [
      '德江'
    ],
    lng: 108.12
  },
  {
    name: '德令哈',
    aliases: [
      '德令哈'
    ],
    lng: 97.37
  },
  {
    name: '德钦',
    aliases: [
      '德钦'
    ],
    lng: 98.92
  },
  {
    name: '德清',
    aliases: [
      '德清'
    ],
    lng: 119.97
  },
  {
    name: '德庆',
    aliases: [
      '德庆'
    ],
    lng: 111.78
  },
  {
    name: '德兴',
    aliases: [
      '德兴'
    ],
    lng: 117.58
  },
  {
    name: '德阳',
    aliases: [
      '德阳'
    ],
    lng: 104.4
  },
  {
    name: '德州',
    aliases: [
      '德州'
    ],
    lng: 116.31
  },
  {
    name: '灯塔',
    aliases: [
      '灯塔'
    ],
    lng: 123.33
  },
  {
    name: '登封',
    aliases: [
      '登封'
    ],
    lng: 113.04
  },
  {
    name: '邓州',
    aliases: [
      '邓州'
    ],
    lng: 112.09
  },
  {
    name: '磴口',
    aliases: [
      '磴口'
    ],
    lng: 107.01
  },
  {
    name: '滴道',
    aliases: [
      '滴道'
    ],
    lng: 130.85
  },
  {
    name: '迪庆',
    aliases: [
      '迪庆'
    ],
    lng: 99.71
  },
  {
    name: '点军',
    aliases: [
      '点军'
    ],
    lng: 111.27
  },
  {
    name: '电白',
    aliases: [
      '电白'
    ],
    lng: 111.01
  },
  {
    name: '垫江',
    aliases: [
      '垫江'
    ],
    lng: 107.35
  },
  {
    name: '钓鱼岛',
    aliases: [
      '钓鱼岛'
    ],
    lng: 123.46
  },
  {
    name: '调兵山',
    aliases: [
      '调兵山'
    ],
    lng: 123.55
  },
  {
    name: '迭部',
    aliases: [
      '迭部'
    ],
    lng: 103.22
  },
  {
    name: '叠彩',
    aliases: [
      '叠彩'
    ],
    lng: 110.3
  },
  {
    name: '丁青',
    aliases: [
      '丁青'
    ],
    lng: 95.6
  },
  {
    name: '鼎城',
    aliases: [
      '鼎城'
    ],
    lng: 111.69
  },
  {
    name: '鼎湖',
    aliases: [
      '鼎湖'
    ],
    lng: 112.57
  },
  {
    name: '定安',
    aliases: [
      '定安'
    ],
    lng: 110.35
  },
  {
    name: '定边',
    aliases: [
      '定边'
    ],
    lng: 107.6
  },
  {
    name: '定海',
    aliases: [
      '定海'
    ],
    lng: 122.11
  },
  {
    name: '定结',
    aliases: [
      '定结'
    ],
    lng: 87.77
  },
  {
    name: '定南',
    aliases: [
      '定南'
    ],
    lng: 115.03
  },
  {
    name: '定日',
    aliases: [
      '定日'
    ],
    lng: 87.12
  },
  {
    name: '定陶',
    aliases: [
      '定陶'
    ],
    lng: 115.57
  },
  {
    name: '定西',
    aliases: [
      '定西'
    ],
    lng: 104.63
  },
  {
    name: '定襄',
    aliases: [
      '定襄'
    ],
    lng: 112.96
  },
  {
    name: '定兴',
    aliases: [
      '定兴'
    ],
    lng: 115.8
  },
  {
    name: '定远',
    aliases: [
      '定远'
    ],
    lng: 117.68
  },
  {
    name: '定州',
    aliases: [
      '定州'
    ],
    lng: 114.99
  },
  {
    name: '东阿',
    aliases: [
      '东阿'
    ],
    lng: 116.25
  },
  {
    name: '东宝',
    aliases: [
      '东宝'
    ],
    lng: 112.2
  },
  {
    name: '东昌',
    aliases: [
      '东昌'
    ],
    lng: 125.94
  },
  {
    name: '东昌府',
    aliases: [
      '东昌府'
    ],
    lng: 115.98
  },
  {
    name: '东城',
    aliases: [
      '东城'
    ],
    lng: 116.42
  },
  {
    name: '东川',
    aliases: [
      '东川'
    ],
    lng: 103.18
  },
  {
    name: '东方',
    aliases: [
      '东方'
    ],
    lng: 108.65
  },
  {
    name: '东丰',
    aliases: [
      '东丰'
    ],
    lng: 125.53
  },
  {
    name: '东风',
    aliases: [
      '东风'
    ],
    lng: 130.4
  },
  {
    name: '东莞',
    aliases: [
      '东莞'
    ],
    lng: 113.75
  },
  {
    name: '东光',
    aliases: [
      '东光'
    ],
    lng: 116.54
  },
  {
    name: '东海',
    aliases: [
      '东海'
    ],
    lng: 118.77
  },
  {
    name: '东河',
    aliases: [
      '东河'
    ],
    lng: 110.03
  },
  {
    name: '东湖',
    aliases: [
      '东湖'
    ],
    lng: 115.89
  },
  {
    name: '东兰',
    aliases: [
      '东兰'
    ],
    lng: 107.37
  },
  {
    name: '东丽',
    aliases: [
      '东丽'
    ],
    lng: 117.31
  },
  {
    name: '东辽',
    aliases: [
      '东辽'
    ],
    lng: 124.99
  },
  {
    name: '东陵',
    aliases: [
      '东陵'
    ],
    lng: 123.46
  },
  {
    name: '东明',
    aliases: [
      '东明'
    ],
    lng: 115.1
  },
  {
    name: '东宁',
    aliases: [
      '东宁'
    ],
    lng: 131.13
  },
  {
    name: '东平',
    aliases: [
      '东平'
    ],
    lng: 116.46
  },
  {
    name: '东坡',
    aliases: [
      '东坡'
    ],
    lng: 103.83
  },
  {
    name: '东区',
    aliases: [
      '东区'
    ],
    lng: 101.72
  },
  {
    name: '东胜',
    aliases: [
      '东胜'
    ],
    lng: 109.99
  },
  {
    name: '东台',
    aliases: [
      '东台'
    ],
    lng: 120.31
  },
  {
    name: '东乌旗',
    aliases: [
      '东乌旗'
    ],
    lng: 116.58
  },
  {
    name: '东西湖',
    aliases: [
      '东西湖'
    ],
    lng: 114.14
  },
  {
    name: '东阳',
    aliases: [
      '东阳'
    ],
    lng: 120.23
  },
  {
    name: '东营',
    aliases: [
      '东营'
    ],
    lng: 118.51
  },
  {
    name: '东源',
    aliases: [
      '东源'
    ],
    lng: 114.74
  },
  {
    name: '东至',
    aliases: [
      '东至'
    ],
    lng: 117.02
  },
  {
    name: '东洲',
    aliases: [
      '东洲'
    ],
    lng: 124.05
  },
  {
    name: '洞口',
    aliases: [
      '洞口'
    ],
    lng: 110.58
  },
  {
    name: '洞头',
    aliases: [
      '洞头'
    ],
    lng: 121.16
  },
  {
    name: '都安',
    aliases: [
      '都安'
    ],
    lng: 108.1
  },
  {
    name: '都昌',
    aliases: [
      '都昌'
    ],
    lng: 116.21
  },
  {
    name: '都江堰',
    aliases: [
      '都江堰'
    ],
    lng: 103.63
  },
  {
    name: '都兰',
    aliases: [
      '都兰'
    ],
    lng: 98.09
  },
  {
    name: '都匀',
    aliases: [
      '都匀'
    ],
    lng: 107.52
  },
  {
    name: '斗门',
    aliases: [
      '斗门'
    ],
    lng: 113.3
  },
  {
    name: '独山',
    aliases: [
      '独山'
    ],
    lng: 107.54
  },
  {
    name: '独山子',
    aliases: [
      '独山子'
    ],
    lng: 84.88
  },
  {
    name: '杜尔伯特',
    aliases: [
      '杜尔伯特'
    ],
    lng: 124.45
  },
  {
    name: '杜集',
    aliases: [
      '杜集'
    ],
    lng: 116.83
  },
  {
    name: '端州',
    aliases: [
      '端州'
    ],
    lng: 112.47
  },
  {
    name: '堆龙德庆',
    aliases: [
      '堆龙德庆'
    ],
    lng: 91
  },
  {
    name: '敦化',
    aliases: [
      '敦化'
    ],
    lng: 128.23
  },
  {
    name: '敦煌',
    aliases: [
      '敦煌'
    ],
    lng: 94.66
  },
  {
    name: '多伦',
    aliases: [
      '多伦'
    ],
    lng: 116.48
  },
  {
    name: '掇刀',
    aliases: [
      '掇刀'
    ],
    lng: 112.2
  },
  {
    name: '峨边',
    aliases: [
      '峨边'
    ],
    lng: 103.26
  },
  {
    name: '峨眉山',
    aliases: [
      '峨眉山'
    ],
    lng: 103.49
  },
  {
    name: '峨山',
    aliases: [
      '峨山'
    ],
    lng: 102.4
  },
  {
    name: '额尔古纳',
    aliases: [
      '额尔古纳'
    ],
    lng: 120.18
  },
  {
    name: '额济纳',
    aliases: [
      '额济纳'
    ],
    lng: 101.07
  },
  {
    name: '额敏',
    aliases: [
      '额敏'
    ],
    lng: 83.62
  },
  {
    name: '鄂城',
    aliases: [
      '鄂城'
    ],
    lng: 114.89
  },
  {
    name: '鄂尔多斯',
    aliases: [
      '鄂尔多斯'
    ],
    lng: 109.99
  },
  {
    name: '鄂伦春旗',
    aliases: [
      '鄂伦春旗'
    ],
    lng: 123.44
  },
  {
    name: '鄂前旗',
    aliases: [
      '鄂前旗'
    ],
    lng: 107.29
  },
  {
    name: '鄂托克',
    aliases: [
      '鄂托克'
    ],
    lng: 107.98
  },
  {
    name: '鄂温克旗',
    aliases: [
      '鄂温克旗'
    ],
    lng: 119.45
  },
  {
    name: '鄂州',
    aliases: [
      '鄂州'
    ],
    lng: 114.89
  },
  {
    name: '恩平',
    aliases: [
      '恩平'
    ],
    lng: 112.31
  },
  {
    name: '恩施',
    aliases: [
      '恩施'
    ],
    lng: 109.49
  },
  {
    name: '恩阳',
    aliases: [
      '恩阳'
    ],
    lng: 106.49
  },
  {
    name: '洱源',
    aliases: [
      '洱源'
    ],
    lng: 99.95
  },
  {
    name: '二道',
    aliases: [
      '二道'
    ],
    lng: 125.38
  },
  {
    name: '二道江',
    aliases: [
      '二道江'
    ],
    lng: 126.05
  },
  {
    name: '二连浩特',
    aliases: [
      '二连浩特'
    ],
    lng: 111.98
  },
  {
    name: '二七',
    aliases: [
      '二七'
    ],
    lng: 113.65
  },
  {
    name: '法库',
    aliases: [
      '法库'
    ],
    lng: 123.42
  },
  {
    name: '番禺',
    aliases: [
      '番禺'
    ],
    lng: 113.36
  },
  {
    name: '樊城',
    aliases: [
      '樊城'
    ],
    lng: 112.14
  },
  {
    name: '繁昌',
    aliases: [
      '繁昌'
    ],
    lng: 118.2
  },
  {
    name: '繁峙',
    aliases: [
      '繁峙'
    ],
    lng: 113.27
  },
  {
    name: '范县',
    aliases: [
      '范县'
    ],
    lng: 115.5
  },
  {
    name: '方城',
    aliases: [
      '方城'
    ],
    lng: 113.01
  },
  {
    name: '方山',
    aliases: [
      '方山'
    ],
    lng: 111.24
  },
  {
    name: '方正',
    aliases: [
      '方正'
    ],
    lng: 128.84
  },
  {
    name: '坊子',
    aliases: [
      '坊子'
    ],
    lng: 119.17
  },
  {
    name: '防城',
    aliases: [
      '防城'
    ],
    lng: 108.36
  },
  {
    name: '防城港',
    aliases: [
      '防城港'
    ],
    lng: 108.35
  },
  {
    name: '房山',
    aliases: [
      '房山'
    ],
    lng: 116.14
  },
  {
    name: '房县',
    aliases: [
      '房县'
    ],
    lng: 110.74
  },
  {
    name: '肥城',
    aliases: [
      '肥城'
    ],
    lng: 116.76
  },
  {
    name: '肥东',
    aliases: [
      '肥东'
    ],
    lng: 117.46
  },
  {
    name: '肥西',
    aliases: [
      '肥西'
    ],
    lng: 117.17
  },
  {
    name: '肥乡',
    aliases: [
      '肥乡'
    ],
    lng: 114.81
  },
  {
    name: '费县',
    aliases: [
      '费县'
    ],
    lng: 117.97
  },
  {
    name: '分宜',
    aliases: [
      '分宜'
    ],
    lng: 114.68
  },
  {
    name: '汾西',
    aliases: [
      '汾西'
    ],
    lng: 111.56
  },
  {
    name: '汾阳',
    aliases: [
      '汾阳'
    ],
    lng: 111.79
  },
  {
    name: '丰城',
    aliases: [
      '丰城'
    ],
    lng: 115.79
  },
  {
    name: '丰都',
    aliases: [
      '丰都'
    ],
    lng: 107.73
  },
  {
    name: '丰满',
    aliases: [
      '丰满'
    ],
    lng: 126.56
  },
  {
    name: '丰南',
    aliases: [
      '丰南'
    ],
    lng: 118.11
  },
  {
    name: '丰宁',
    aliases: [
      '丰宁'
    ],
    lng: 116.65
  },
  {
    name: '丰润',
    aliases: [
      '丰润'
    ],
    lng: 118.16
  },
  {
    name: '丰顺',
    aliases: [
      '丰顺'
    ],
    lng: 116.18
  },
  {
    name: '丰台',
    aliases: [
      '丰台'
    ],
    lng: 116.29
  },
  {
    name: '丰县',
    aliases: [
      '丰县'
    ],
    lng: 116.59
  },
  {
    name: '丰泽',
    aliases: [
      '丰泽'
    ],
    lng: 118.61
  },
  {
    name: '丰镇',
    aliases: [
      '丰镇'
    ],
    lng: 113.16
  },
  {
    name: '封开',
    aliases: [
      '封开'
    ],
    lng: 111.5
  },
  {
    name: '封丘',
    aliases: [
      '封丘'
    ],
    lng: 114.42
  },
  {
    name: '峰峰',
    aliases: [
      '峰峰'
    ],
    lng: 114.21
  },
  {
    name: '凤城',
    aliases: [
      '凤城'
    ],
    lng: 124.07
  },
  {
    name: '凤冈',
    aliases: [
      '凤冈'
    ],
    lng: 107.72
  },
  {
    name: '凤凰',
    aliases: [
      '凤凰'
    ],
    lng: 109.6
  },
  {
    name: '凤庆',
    aliases: [
      '凤庆'
    ],
    lng: 99.92
  },
  {
    name: '凤泉',
    aliases: [
      '凤泉'
    ],
    lng: 113.91
  },
  {
    name: '凤山',
    aliases: [
      '凤山'
    ],
    lng: 107.04
  },
  {
    name: '凤台',
    aliases: [
      '凤台'
    ],
    lng: 116.72
  },
  {
    name: '凤县',
    aliases: [
      '凤县'
    ],
    lng: 106.53
  },
  {
    name: '凤翔',
    aliases: [
      '凤翔'
    ],
    lng: 107.4
  },
  {
    name: '凤阳',
    aliases: [
      '凤阳'
    ],
    lng: 117.56
  },
  {
    name: '奉化',
    aliases: [
      '奉化'
    ],
    lng: 121.41
  },
  {
    name: '奉节',
    aliases: [
      '奉节'
    ],
    lng: 109.47
  },
  {
    name: '奉贤',
    aliases: [
      '奉贤'
    ],
    lng: 121.46
  },
  {
    name: '奉新',
    aliases: [
      '奉新'
    ],
    lng: 115.39
  },
  {
    name: '佛冈',
    aliases: [
      '佛冈'
    ],
    lng: 113.53
  },
  {
    name: '佛坪',
    aliases: [
      '佛坪'
    ],
    lng: 107.99
  },
  {
    name: '佛山',
    aliases: [
      '佛山'
    ],
    lng: 113.12
  },
  {
    name: '扶风',
    aliases: [
      '扶风'
    ],
    lng: 107.89
  },
  {
    name: '扶沟',
    aliases: [
      '扶沟'
    ],
    lng: 114.39
  },
  {
    name: '扶绥',
    aliases: [
      '扶绥'
    ],
    lng: 107.91
  },
  {
    name: '扶余',
    aliases: [
      '扶余'
    ],
    lng: 126.04
  },
  {
    name: '芙蓉',
    aliases: [
      '芙蓉'
    ],
    lng: 112.99
  },
  {
    name: '浮梁',
    aliases: [
      '浮梁'
    ],
    lng: 117.22
  },
  {
    name: '浮山',
    aliases: [
      '浮山'
    ],
    lng: 111.85
  },
  {
    name: '涪城',
    aliases: [
      '涪城'
    ],
    lng: 104.74
  },
  {
    name: '涪陵',
    aliases: [
      '涪陵'
    ],
    lng: 107.39
  },
  {
    name: '福安',
    aliases: [
      '福安'
    ],
    lng: 119.65
  },
  {
    name: '福鼎',
    aliases: [
      '福鼎'
    ],
    lng: 120.22
  },
  {
    name: '福贡',
    aliases: [
      '福贡'
    ],
    lng: 98.87
  },
  {
    name: '福海',
    aliases: [
      '福海'
    ],
    lng: 87.49
  },
  {
    name: '福绵',
    aliases: [
      '福绵'
    ],
    lng: 110.05
  },
  {
    name: '福清',
    aliases: [
      '福清'
    ],
    lng: 119.38
  },
  {
    name: '福泉',
    aliases: [
      '福泉'
    ],
    lng: 107.51
  },
  {
    name: '福山',
    aliases: [
      '福山'
    ],
    lng: 121.26
  },
  {
    name: '福田',
    aliases: [
      '福田'
    ],
    lng: 114.05
  },
  {
    name: '福州',
    aliases: [
      '福州'
    ],
    lng: 119.31
  },
  {
    name: '抚宁',
    aliases: [
      '抚宁'
    ],
    lng: 119.24
  },
  {
    name: '抚顺',
    aliases: [
      '抚顺'
    ],
    lng: 124.1
  },
  {
    name: '抚松',
    aliases: [
      '抚松'
    ],
    lng: 127.27
  },
  {
    name: '抚远',
    aliases: [
      '抚远'
    ],
    lng: 134.29
  },
  {
    name: '抚州',
    aliases: [
      '抚州'
    ],
    lng: 116.36
  },
  {
    name: '府谷',
    aliases: [
      '府谷'
    ],
    lng: 111.07
  },
  {
    name: '阜城',
    aliases: [
      '阜城'
    ],
    lng: 116.16
  },
  {
    name: '阜康',
    aliases: [
      '阜康'
    ],
    lng: 87.98
  },
  {
    name: '阜南',
    aliases: [
      '阜南'
    ],
    lng: 115.59
  },
  {
    name: '阜宁',
    aliases: [
      '阜宁'
    ],
    lng: 119.81
  },
  {
    name: '阜平',
    aliases: [
      '阜平'
    ],
    lng: 114.2
  },
  {
    name: '阜新',
    aliases: [
      '阜新'
    ],
    lng: 121.74
  },
  {
    name: '阜阳',
    aliases: [
      '阜阳'
    ],
    lng: 115.82
  },
  {
    name: '复兴',
    aliases: [
      '复兴'
    ],
    lng: 114.46
  },
  {
    name: '富川',
    aliases: [
      '富川'
    ],
    lng: 111.28
  },
  {
    name: '富锦',
    aliases: [
      '富锦'
    ],
    lng: 132.04
  },
  {
    name: '富拉尔基',
    aliases: [
      '富拉尔基'
    ],
    lng: 123.64
  },
  {
    name: '富民',
    aliases: [
      '富民'
    ],
    lng: 102.5
  },
  {
    name: '富宁',
    aliases: [
      '富宁'
    ],
    lng: 105.63
  },
  {
    name: '富平',
    aliases: [
      '富平'
    ],
    lng: 109.19
  },
  {
    name: '富顺',
    aliases: [
      '富顺'
    ],
    lng: 104.98
  },
  {
    name: '富县',
    aliases: [
      '富县'
    ],
    lng: 109.38
  },
  {
    name: '富阳',
    aliases: [
      '富阳'
    ],
    lng: 119.95
  },
  {
    name: '富裕',
    aliases: [
      '富裕'
    ],
    lng: 124.47
  },
  {
    name: '富源',
    aliases: [
      '富源'
    ],
    lng: 104.26
  },
  {
    name: '富蕴',
    aliases: [
      '富蕴'
    ],
    lng: 89.52
  },
  {
    name: '噶尔',
    aliases: [
      '噶尔'
    ],
    lng: 80.11
  },
  {
    name: '改则',
    aliases: [
      '改则'
    ],
    lng: 84.06
  },
  {
    name: '盖州',
    aliases: [
      '盖州'
    ],
    lng: 122.36
  },
  {
    name: '甘德',
    aliases: [
      '甘德'
    ],
    lng: 99.9
  },
  {
    name: '甘谷',
    aliases: [
      '甘谷'
    ],
    lng: 105.33
  },
  {
    name: '甘井子',
    aliases: [
      '甘井子'
    ],
    lng: 121.58
  },
  {
    name: '甘洛',
    aliases: [
      '甘洛'
    ],
    lng: 102.78
  },
  {
    name: '甘泉',
    aliases: [
      '甘泉'
    ],
    lng: 109.35
  },
  {
    name: '甘州',
    aliases: [
      '甘州'
    ],
    lng: 100.45
  },
  {
    name: '甘孜',
    aliases: [
      '甘孜'
    ],
    lng: 101.96
  },
  {
    name: '赣县',
    aliases: [
      '赣县'
    ],
    lng: 115.02
  },
  {
    name: '赣榆',
    aliases: [
      '赣榆'
    ],
    lng: 119.13
  },
  {
    name: '赣州',
    aliases: [
      '赣州',
      '赣县'
    ],
    lng: 114.93
  },
  {
    name: '刚察',
    aliases: [
      '刚察'
    ],
    lng: 100.14
  },
  {
    name: '钢城',
    aliases: [
      '钢城'
    ],
    lng: 117.82
  },
  {
    name: '岗巴',
    aliases: [
      '岗巴'
    ],
    lng: 88.52
  },
  {
    name: '港北',
    aliases: [
      '港北'
    ],
    lng: 109.59
  },
  {
    name: '港口',
    aliases: [
      '港口'
    ],
    lng: 108.35
  },
  {
    name: '港南',
    aliases: [
      '港南'
    ],
    lng: 109.6
  },
  {
    name: '港闸',
    aliases: [
      '港闸'
    ],
    lng: 120.83
  },
  {
    name: '皋兰',
    aliases: [
      '皋兰'
    ],
    lng: 103.95
  },
  {
    name: '高安',
    aliases: [
      '高安'
    ],
    lng: 115.38
  },
  {
    name: '高碑店',
    aliases: [
      '高碑店'
    ],
    lng: 115.88
  },
  {
    name: '高昌',
    aliases: [
      '高昌'
    ],
    lng: 89.18
  },
  {
    name: '高淳',
    aliases: [
      '高淳'
    ],
    lng: 118.88
  },
  {
    name: '高港',
    aliases: [
      '高港'
    ],
    lng: 119.88
  },
  {
    name: '高陵',
    aliases: [
      '高陵'
    ],
    lng: 109.09
  },
  {
    name: '高密',
    aliases: [
      '高密'
    ],
    lng: 119.76
  },
  {
    name: '高明',
    aliases: [
      '高明'
    ],
    lng: 112.88
  },
  {
    name: '高平',
    aliases: [
      '高平'
    ],
    lng: 112.93
  },
  {
    name: '高坪',
    aliases: [
      '高坪'
    ],
    lng: 106.11
  },
  {
    name: '高青',
    aliases: [
      '高青'
    ],
    lng: 117.83
  },
  {
    name: '高台',
    aliases: [
      '高台'
    ],
    lng: 99.82
  },
  {
    name: '高唐',
    aliases: [
      '高唐'
    ],
    lng: 116.23
  },
  {
    name: '高县',
    aliases: [
      '高县'
    ],
    lng: 104.52
  },
  {
    name: '高雄',
    aliases: [
      '高雄'
    ],
    lng: 120.28
  },
  {
    name: '高阳',
    aliases: [
      '高阳'
    ],
    lng: 115.78
  },
  {
    name: '高要',
    aliases: [
      '高要'
    ],
    lng: 112.46
  },
  {
    name: '高邑',
    aliases: [
      '高邑'
    ],
    lng: 114.61
  },
  {
    name: '高邮',
    aliases: [
      '高邮'
    ],
    lng: 119.44
  },
  {
    name: '高州',
    aliases: [
      '高州'
    ],
    lng: 110.85
  },
  {
    name: '藁城',
    aliases: [
      '藁城'
    ],
    lng: 114.85
  },
  {
    name: '革吉',
    aliases: [
      '革吉'
    ],
    lng: 81.14
  },
  {
    name: '格尔木',
    aliases: [
      '格尔木'
    ],
    lng: 94.91
  },
  {
    name: '个旧',
    aliases: [
      '个旧'
    ],
    lng: 103.15
  },
  {
    name: '根河',
    aliases: [
      '根河'
    ],
    lng: 121.53
  },
  {
    name: '耿马',
    aliases: [
      '耿马'
    ],
    lng: 99.4
  },
  {
    name: '工布江达',
    aliases: [
      '工布江达'
    ],
    lng: 93.25
  },
  {
    name: '工农',
    aliases: [
      '工农'
    ],
    lng: 130.28
  },
  {
    name: '弓长岭',
    aliases: [
      '弓长岭'
    ],
    lng: 123.43
  },
  {
    name: '公安',
    aliases: [
      '公安'
    ],
    lng: 112.23
  },
  {
    name: '公主岭',
    aliases: [
      '公主岭'
    ],
    lng: 124.82
  },
  {
    name: '恭城',
    aliases: [
      '恭城'
    ],
    lng: 110.83
  },
  {
    name: '巩留',
    aliases: [
      '巩留'
    ],
    lng: 82.23
  },
  {
    name: '巩义',
    aliases: [
      '巩义'
    ],
    lng: 112.98
  },
  {
    name: '拱墅',
    aliases: [
      '拱墅'
    ],
    lng: 120.15
  },
  {
    name: '珙县',
    aliases: [
      '珙县'
    ],
    lng: 104.71
  },
  {
    name: '共和',
    aliases: [
      '共和'
    ],
    lng: 100.62
  },
  {
    name: '共青城',
    aliases: [
      '共青城'
    ],
    lng: 115.81
  },
  {
    name: '贡嘎',
    aliases: [
      '贡嘎'
    ],
    lng: 90.99
  },
  {
    name: '贡井',
    aliases: [
      '贡井'
    ],
    lng: 104.71
  },
  {
    name: '贡觉',
    aliases: [
      '贡觉'
    ],
    lng: 98.27
  },
  {
    name: '贡山',
    aliases: [
      '贡山'
    ],
    lng: 98.67
  },
  {
    name: '姑苏',
    aliases: [
      '姑苏'
    ],
    lng: 120.62
  },
  {
    name: '沽源',
    aliases: [
      '沽源'
    ],
    lng: 115.68
  },
  {
    name: '古城',
    aliases: [
      '古城'
    ],
    lng: 100.23
  },
  {
    name: '古交',
    aliases: [
      '古交'
    ],
    lng: 112.17
  },
  {
    name: '古浪',
    aliases: [
      '古浪'
    ],
    lng: 102.9
  },
  {
    name: '古蔺',
    aliases: [
      '古蔺'
    ],
    lng: 105.81
  },
  {
    name: '古塔',
    aliases: [
      '古塔'
    ],
    lng: 121.13
  },
  {
    name: '古田',
    aliases: [
      '古田'
    ],
    lng: 118.74
  },
  {
    name: '古县',
    aliases: [
      '古县'
    ],
    lng: 111.92
  },
  {
    name: '古冶',
    aliases: [
      '古冶'
    ],
    lng: 118.45
  },
  {
    name: '古丈',
    aliases: [
      '古丈'
    ],
    lng: 109.95
  },
  {
    name: '谷城',
    aliases: [
      '谷城'
    ],
    lng: 111.64
  },
  {
    name: '固安',
    aliases: [
      '固安'
    ],
    lng: 116.3
  },
  {
    name: '固始',
    aliases: [
      '固始'
    ],
    lng: 115.67
  },
  {
    name: '固阳',
    aliases: [
      '固阳'
    ],
    lng: 110.06
  },
  {
    name: '固原',
    aliases: [
      '固原'
    ],
    lng: 106.29
  },
  {
    name: '固镇',
    aliases: [
      '固镇'
    ],
    lng: 117.32
  },
  {
    name: '故城',
    aliases: [
      '故城'
    ],
    lng: 115.97
  },
  {
    name: '瓜州',
    aliases: [
      '瓜州'
    ],
    lng: 95.78
  },
  {
    name: '关岭',
    aliases: [
      '关岭'
    ],
    lng: 105.62
  },
  {
    name: '观山湖',
    aliases: [
      '观山湖'
    ],
    lng: 106.63
  },
  {
    name: '官渡',
    aliases: [
      '官渡'
    ],
    lng: 102.72
  },
  {
    name: '冠县',
    aliases: [
      '冠县'
    ],
    lng: 115.44
  },
  {
    name: '馆陶',
    aliases: [
      '馆陶'
    ],
    lng: 115.29
  },
  {
    name: '管城',
    aliases: [
      '管城'
    ],
    lng: 113.69
  },
  {
    name: '灌南',
    aliases: [
      '灌南'
    ],
    lng: 119.35
  },
  {
    name: '灌阳',
    aliases: [
      '灌阳'
    ],
    lng: 111.16
  },
  {
    name: '灌云',
    aliases: [
      '灌云'
    ],
    lng: 119.26
  },
  {
    name: '光山',
    aliases: [
      '光山'
    ],
    lng: 114.9
  },
  {
    name: '光泽',
    aliases: [
      '光泽'
    ],
    lng: 117.34
  },
  {
    name: '广安',
    aliases: [
      '广安'
    ],
    lng: 106.63
  },
  {
    name: '广昌',
    aliases: [
      '广昌'
    ],
    lng: 116.33
  },
  {
    name: '广德',
    aliases: [
      '广德'
    ],
    lng: 119.42
  },
  {
    name: '广丰',
    aliases: [
      '广丰'
    ],
    lng: 118.19
  },
  {
    name: '广汉',
    aliases: [
      '广汉'
    ],
    lng: 104.28
  },
  {
    name: '广河',
    aliases: [
      '广河'
    ],
    lng: 103.58
  },
  {
    name: '广灵',
    aliases: [
      '广灵'
    ],
    lng: 114.28
  },
  {
    name: '广陵',
    aliases: [
      '广陵'
    ],
    lng: 119.44
  },
  {
    name: '广南',
    aliases: [
      '广南'
    ],
    lng: 105.06
  },
  {
    name: '广宁',
    aliases: [
      '广宁'
    ],
    lng: 112.44
  },
  {
    name: '广平',
    aliases: [
      '广平'
    ],
    lng: 114.95
  },
  {
    name: '广饶',
    aliases: [
      '广饶'
    ],
    lng: 118.41
  },
  {
    name: '广水',
    aliases: [
      '广水'
    ],
    lng: 113.83
  },
  {
    name: '广阳',
    aliases: [
      '广阳'
    ],
    lng: 116.71
  },
  {
    name: '广元',
    aliases: [
      '广元'
    ],
    lng: 105.83
  },
  {
    name: '广州',
    aliases: [
      '广州'
    ],
    lng: 113.26
  },
  {
    name: '广宗',
    aliases: [
      '广宗'
    ],
    lng: 115.14
  },
  {
    name: '贵池',
    aliases: [
      '贵池'
    ],
    lng: 117.49
  },
  {
    name: '贵德',
    aliases: [
      '贵德'
    ],
    lng: 101.43
  },
  {
    name: '贵定',
    aliases: [
      '贵定'
    ],
    lng: 107.23
  },
  {
    name: '贵港',
    aliases: [
      '贵港'
    ],
    lng: 109.6
  },
  {
    name: '贵南',
    aliases: [
      '贵南'
    ],
    lng: 100.75
  },
  {
    name: '贵溪',
    aliases: [
      '贵溪'
    ],
    lng: 117.21
  },
  {
    name: '贵阳',
    aliases: [
      '贵阳'
    ],
    lng: 106.71
  },
  {
    name: '桂东',
    aliases: [
      '桂东'
    ],
    lng: 113.95
  },
  {
    name: '桂林',
    aliases: [
      '桂林'
    ],
    lng: 110.3
  },
  {
    name: '桂平',
    aliases: [
      '桂平'
    ],
    lng: 110.07
  },
  {
    name: '桂阳',
    aliases: [
      '桂阳'
    ],
    lng: 112.73
  },
  {
    name: '果洛',
    aliases: [
      '果洛'
    ],
    lng: 100.24
  },
  {
    name: '哈巴河',
    aliases: [
      '哈巴河'
    ],
    lng: 86.42
  },
  {
    name: '哈尔滨',
    aliases: [
      '哈尔滨',
      '哈市'
    ],
    lng: 126.64
  },
  {
    name: '哈密',
    aliases: [
      '哈密'
    ],
    lng: 93.51
  },
  {
    name: '海安',
    aliases: [
      '海安'
    ],
    lng: 120.47
  },
  {
    name: '海北',
    aliases: [
      '海北'
    ],
    lng: 100.9
  },
  {
    name: '海勃湾',
    aliases: [
      '海勃湾'
    ],
    lng: 106.82
  },
  {
    name: '海沧',
    aliases: [
      '海沧'
    ],
    lng: 118.04
  },
  {
    name: '海淀',
    aliases: [
      '海淀'
    ],
    lng: 116.31
  },
  {
    name: '海东',
    aliases: [
      '海东'
    ],
    lng: 102.1
  },
  {
    name: '海丰',
    aliases: [
      '海丰'
    ],
    lng: 115.34
  },
  {
    name: '海港',
    aliases: [
      '海港'
    ],
    lng: 119.6
  },
  {
    name: '海口',
    aliases: [
      '海口'
    ],
    lng: 110.33
  },
  {
    name: '海拉尔',
    aliases: [
      '海拉尔'
    ],
    lng: 119.76
  },
  {
    name: '海林',
    aliases: [
      '海林'
    ],
    lng: 129.39
  },
  {
    name: '海陵',
    aliases: [
      '海陵'
    ],
    lng: 119.92
  },
  {
    name: '海伦',
    aliases: [
      '海伦'
    ],
    lng: 126.97
  },
  {
    name: '海门',
    aliases: [
      '海门'
    ],
    lng: 121.18
  },
  {
    name: '海宁',
    aliases: [
      '海宁'
    ],
    lng: 120.69
  },
  {
    name: '海曙',
    aliases: [
      '海曙'
    ],
    lng: 121.54
  },
  {
    name: '海棠',
    aliases: [
      '海棠'
    ],
    lng: 109.76
  },
  {
    name: '海西',
    aliases: [
      '海西'
    ],
    lng: 95.36
  },
  {
    name: '海兴',
    aliases: [
      '海兴'
    ],
    lng: 117.5
  },
  {
    name: '海盐',
    aliases: [
      '海盐'
    ],
    lng: 120.94
  },
  {
    name: '海晏',
    aliases: [
      '海晏'
    ],
    lng: 100.9
  },
  {
    name: '海阳',
    aliases: [
      '海阳'
    ],
    lng: 121.17
  },
  {
    name: '海原',
    aliases: [
      '海原'
    ],
    lng: 105.65
  },
  {
    name: '海珠',
    aliases: [
      '海珠'
    ],
    lng: 113.26
  },
  {
    name: '邗江',
    aliases: [
      '邗江'
    ],
    lng: 119.4
  },
  {
    name: '含山',
    aliases: [
      '含山'
    ],
    lng: 118.11
  },
  {
    name: '邯郸',
    aliases: [
      '邯郸'
    ],
    lng: 114.49
  },
  {
    name: '邯山',
    aliases: [
      '邯山'
    ],
    lng: 114.48
  },
  {
    name: '涵江',
    aliases: [
      '涵江'
    ],
    lng: 119.12
  },
  {
    name: '寒亭',
    aliases: [
      '寒亭'
    ],
    lng: 119.21
  },
  {
    name: '韩城',
    aliases: [
      '韩城'
    ],
    lng: 110.45
  },
  {
    name: '汉滨',
    aliases: [
      '汉滨'
    ],
    lng: 109.03
  },
  {
    name: '汉川',
    aliases: [
      '汉川'
    ],
    lng: 113.84
  },
  {
    name: '汉南',
    aliases: [
      '汉南'
    ],
    lng: 114.08
  },
  {
    name: '汉寿',
    aliases: [
      '汉寿'
    ],
    lng: 111.97
  },
  {
    name: '汉台',
    aliases: [
      '汉台'
    ],
    lng: 107.03
  },
  {
    name: '汉阳',
    aliases: [
      '汉阳'
    ],
    lng: 114.27
  },
  {
    name: '汉阴',
    aliases: [
      '汉阴'
    ],
    lng: 108.51
  },
  {
    name: '汉源',
    aliases: [
      '汉源'
    ],
    lng: 102.68
  },
  {
    name: '汉中',
    aliases: [
      '汉中'
    ],
    lng: 107.03
  },
  {
    name: '杭锦后旗',
    aliases: [
      '杭锦后旗'
    ],
    lng: 107.15
  },
  {
    name: '杭锦旗',
    aliases: [
      '杭锦旗'
    ],
    lng: 108.74
  },
  {
    name: '杭州',
    aliases: [
      '杭州'
    ],
    lng: 120.15
  },
  {
    name: '濠江',
    aliases: [
      '濠江'
    ],
    lng: 116.73
  },
  {
    name: '合川',
    aliases: [
      '合川'
    ],
    lng: 106.27
  },
  {
    name: '合肥',
    aliases: [
      '合肥'
    ],
    lng: 117.28
  },
  {
    name: '合江',
    aliases: [
      '合江'
    ],
    lng: 105.83
  },
  {
    name: '合浦',
    aliases: [
      '合浦'
    ],
    lng: 109.2
  },
  {
    name: '合山',
    aliases: [
      '合山'
    ],
    lng: 108.89
  },
  {
    name: '合水',
    aliases: [
      '合水'
    ],
    lng: 108.02
  },
  {
    name: '合阳',
    aliases: [
      '合阳'
    ],
    lng: 110.15
  },
  {
    name: '合作',
    aliases: [
      '合作'
    ],
    lng: 102.91
  },
  {
    name: '和布克赛尔',
    aliases: [
      '和布克赛尔'
    ],
    lng: 85.73
  },
  {
    name: '和静',
    aliases: [
      '和静'
    ],
    lng: 86.39
  },
  {
    name: '和林',
    aliases: [
      '和林'
    ],
    lng: 111.82
  },
  {
    name: '和龙',
    aliases: [
      '和龙'
    ],
    lng: 129.01
  },
  {
    name: '和顺',
    aliases: [
      '和顺'
    ],
    lng: 113.57
  },
  {
    name: '和硕',
    aliases: [
      '和硕'
    ],
    lng: 86.86
  },
  {
    name: '和田',
    aliases: [
      '和田'
    ],
    lng: 79.93
  },
  {
    name: '和县',
    aliases: [
      '和县'
    ],
    lng: 118.36
  },
  {
    name: '和政',
    aliases: [
      '和政'
    ],
    lng: 103.35
  },
  {
    name: '河北',
    aliases: [
      '河北'
    ],
    lng: 117.2
  },
  {
    name: '河池',
    aliases: [
      '河池'
    ],
    lng: 108.06
  },
  {
    name: '河间',
    aliases: [
      '河间'
    ],
    lng: 116.09
  },
  {
    name: '河津',
    aliases: [
      '河津'
    ],
    lng: 110.71
  },
  {
    name: '河南',
    aliases: [
      '河南'
    ],
    lng: 101.61
  },
  {
    name: '河曲',
    aliases: [
      '河曲'
    ],
    lng: 111.15
  },
  {
    name: '河西',
    aliases: [
      '河西'
    ],
    lng: 117.22
  },
  {
    name: '河源',
    aliases: [
      '河源'
    ],
    lng: 114.7
  },
  {
    name: '荷塘',
    aliases: [
      '荷塘'
    ],
    lng: 113.16
  },
  {
    name: '菏泽',
    aliases: [
      '菏泽'
    ],
    lng: 115.47
  },
  {
    name: '贺兰',
    aliases: [
      '贺兰'
    ],
    lng: 106.35
  },
  {
    name: '贺州',
    aliases: [
      '贺州'
    ],
    lng: 111.55
  },
  {
    name: '赫山区',
    aliases: [
      '赫山区'
    ],
    lng: 112.36
  },
  {
    name: '赫章',
    aliases: [
      '赫章'
    ],
    lng: 104.73
  },
  {
    name: '鹤壁',
    aliases: [
      '鹤壁'
    ],
    lng: 114.3
  },
  {
    name: '鹤城',
    aliases: [
      '鹤城'
    ],
    lng: 109.98
  },
  {
    name: '鹤峰',
    aliases: [
      '鹤峰'
    ],
    lng: 110.03
  },
  {
    name: '鹤岗',
    aliases: [
      '鹤岗'
    ],
    lng: 130.28
  },
  {
    name: '鹤庆',
    aliases: [
      '鹤庆'
    ],
    lng: 100.17
  },
  {
    name: '黑河',
    aliases: [
      '黑河'
    ],
    lng: 127.5
  },
  {
    name: '黑山',
    aliases: [
      '黑山'
    ],
    lng: 122.12
  },
  {
    name: '黑水',
    aliases: [
      '黑水'
    ],
    lng: 102.99
  },
  {
    name: '恒山',
    aliases: [
      '恒山'
    ],
    lng: 130.91
  },
  {
    name: '横峰',
    aliases: [
      '横峰'
    ],
    lng: 117.61
  },
  {
    name: '横山',
    aliases: [
      '横山'
    ],
    lng: 109.29
  },
  {
    name: '横县',
    aliases: [
      '横县'
    ],
    lng: 109.27
  },
  {
    name: '衡东',
    aliases: [
      '衡东'
    ],
    lng: 112.95
  },
  {
    name: '衡南',
    aliases: [
      '衡南'
    ],
    lng: 112.68
  },
  {
    name: '衡山',
    aliases: [
      '衡山'
    ],
    lng: 112.87
  },
  {
    name: '衡水',
    aliases: [
      '衡水'
    ],
    lng: 115.67
  },
  {
    name: '衡阳',
    aliases: [
      '衡阳'
    ],
    lng: 112.61
  },
  {
    name: '衡阳县',
    aliases: [
      '衡阳县'
    ],
    lng: 112.38
  },
  {
    name: '红安',
    aliases: [
      '红安'
    ],
    lng: 114.62
  },
  {
    name: '红岗',
    aliases: [
      '红岗'
    ],
    lng: 124.89
  },
  {
    name: '红古',
    aliases: [
      '红古'
    ],
    lng: 102.86
  },
  {
    name: '红河',
    aliases: [
      '红河'
    ],
    lng: 103.38
  },
  {
    name: '红花岗',
    aliases: [
      '红花岗'
    ],
    lng: 106.94
  },
  {
    name: '红旗',
    aliases: [
      '红旗'
    ],
    lng: 113.88
  },
  {
    name: '红桥',
    aliases: [
      '红桥'
    ],
    lng: 117.16
  },
  {
    name: '红山',
    aliases: [
      '红山'
    ],
    lng: 118.96
  },
  {
    name: '红寺堡',
    aliases: [
      '红寺堡'
    ],
    lng: 106.07
  },
  {
    name: '红塔',
    aliases: [
      '红塔'
    ],
    lng: 102.54
  },
  {
    name: '红星',
    aliases: [
      '红星'
    ],
    lng: 129.39
  },
  {
    name: '红原',
    aliases: [
      '红原'
    ],
    lng: 102.54
  },
  {
    name: '宏伟',
    aliases: [
      '宏伟'
    ],
    lng: 123.2
  },
  {
    name: '洪洞',
    aliases: [
      '洪洞'
    ],
    lng: 111.67
  },
  {
    name: '洪湖',
    aliases: [
      '洪湖'
    ],
    lng: 113.47
  },
  {
    name: '洪江',
    aliases: [
      '洪江'
    ],
    lng: 109.83
  },
  {
    name: '洪山',
    aliases: [
      '洪山'
    ],
    lng: 114.4
  },
  {
    name: '洪雅',
    aliases: [
      '洪雅'
    ],
    lng: 103.38
  },
  {
    name: '洪泽',
    aliases: [
      '洪泽'
    ],
    lng: 118.87
  },
  {
    name: '虹口',
    aliases: [
      '虹口'
    ],
    lng: 121.49
  },
  {
    name: '侯马',
    aliases: [
      '侯马'
    ],
    lng: 111.37
  },
  {
    name: '呼和浩特',
    aliases: [
      '呼和浩特',
      '呼市'
    ],
    lng: 111.75
  },
  {
    name: '呼兰',
    aliases: [
      '呼兰'
    ],
    lng: 126.6
  },
  {
    name: '呼伦贝尔',
    aliases: [
      '呼伦贝尔'
    ],
    lng: 119.76
  },
  {
    name: '呼玛',
    aliases: [
      '呼玛'
    ],
    lng: 126.66
  },
  {
    name: '呼图壁',
    aliases: [
      '呼图壁'
    ],
    lng: 86.89
  },
  {
    name: '壶关',
    aliases: [
      '壶关'
    ],
    lng: 113.21
  },
  {
    name: '湖滨',
    aliases: [
      '湖滨'
    ],
    lng: 111.19
  },
  {
    name: '湖口',
    aliases: [
      '湖口'
    ],
    lng: 116.24
  },
  {
    name: '湖里',
    aliases: [
      '湖里'
    ],
    lng: 118.11
  },
  {
    name: '湖州',
    aliases: [
      '湖州'
    ],
    lng: 120.1
  },
  {
    name: '葫芦岛',
    aliases: [
      '葫芦岛'
    ],
    lng: 120.86
  },
  {
    name: '虎林',
    aliases: [
      '虎林'
    ],
    lng: 132.97
  },
  {
    name: '虎丘',
    aliases: [
      '虎丘'
    ],
    lng: 120.57
  },
  {
    name: '互助',
    aliases: [
      '互助'
    ],
    lng: 101.96
  },
  {
    name: '户县',
    aliases: [
      '户县'
    ],
    lng: 108.61
  },
  {
    name: '花都',
    aliases: [
      '花都'
    ],
    lng: 113.21
  },
  {
    name: '花莲',
    aliases: [
      '花莲'
    ],
    lng: 121.6
  },
  {
    name: '花山',
    aliases: [
      '花山'
    ],
    lng: 118.51
  },
  {
    name: '花溪',
    aliases: [
      '花溪'
    ],
    lng: 106.67
  },
  {
    name: '花垣',
    aliases: [
      '花垣'
    ],
    lng: 109.48
  },
  {
    name: '华安',
    aliases: [
      '华安'
    ],
    lng: 117.54
  },
  {
    name: '华池',
    aliases: [
      '华池'
    ],
    lng: 107.99
  },
  {
    name: '华龙',
    aliases: [
      '华龙'
    ],
    lng: 115.03
  },
  {
    name: '华宁',
    aliases: [
      '华宁'
    ],
    lng: 102.93
  },
  {
    name: '华坪',
    aliases: [
      '华坪'
    ],
    lng: 101.27
  },
  {
    name: '华亭',
    aliases: [
      '华亭'
    ],
    lng: 106.65
  },
  {
    name: '华县',
    aliases: [
      '华县'
    ],
    lng: 109.44
  },
  {
    name: '华阴',
    aliases: [
      '华阴'
    ],
    lng: 110.09
  },
  {
    name: '华蓥',
    aliases: [
      '华蓥'
    ],
    lng: 106.78
  },
  {
    name: '华州',
    aliases: [
      '华州'
    ],
    lng: 109.76
  },
  {
    name: '滑县',
    aliases: [
      '滑县'
    ],
    lng: 114.52
  },
  {
    name: '化德',
    aliases: [
      '化德'
    ],
    lng: 114.01
  },
  {
    name: '化隆',
    aliases: [
      '化隆'
    ],
    lng: 102.26
  },
  {
    name: '化州',
    aliases: [
      '化州'
    ],
    lng: 110.64
  },
  {
    name: '桦川',
    aliases: [
      '桦川'
    ],
    lng: 130.72
  },
  {
    name: '桦甸',
    aliases: [
      '桦甸'
    ],
    lng: 126.75
  },
  {
    name: '桦南',
    aliases: [
      '桦南'
    ],
    lng: 130.57
  },
  {
    name: '怀安',
    aliases: [
      '怀安'
    ],
    lng: 114.42
  },
  {
    name: '怀化',
    aliases: [
      '怀化'
    ],
    lng: 109.98
  },
  {
    name: '怀集',
    aliases: [
      '怀集'
    ],
    lng: 112.18
  },
  {
    name: '怀来',
    aliases: [
      '怀来'
    ],
    lng: 115.52
  },
  {
    name: '怀宁',
    aliases: [
      '怀宁'
    ],
    lng: 116.83
  },
  {
    name: '怀仁',
    aliases: [
      '怀仁'
    ],
    lng: 113.1
  },
  {
    name: '怀柔',
    aliases: [
      '怀柔'
    ],
    lng: 116.64
  },
  {
    name: '怀远',
    aliases: [
      '怀远'
    ],
    lng: 117.2
  },
  {
    name: '淮安',
    aliases: [
      '淮安'
    ],
    lng: 119.02
  },
  {
    name: '淮安区',
    aliases: [
      '淮安区'
    ],
    lng: 119.15
  },
  {
    name: '淮北',
    aliases: [
      '淮北'
    ],
    lng: 116.79
  },
  {
    name: '淮滨',
    aliases: [
      '淮滨'
    ],
    lng: 115.42
  },
  {
    name: '淮南',
    aliases: [
      '淮南'
    ],
    lng: 117.02
  },
  {
    name: '淮上',
    aliases: [
      '淮上'
    ],
    lng: 117.35
  },
  {
    name: '淮阳',
    aliases: [
      '淮阳'
    ],
    lng: 114.87
  },
  {
    name: '淮阴区',
    aliases: [
      '淮阴区'
    ],
    lng: 119.02
  },
  {
    name: '槐荫',
    aliases: [
      '槐荫'
    ],
    lng: 116.95
  },
  {
    name: '环翠',
    aliases: [
      '环翠'
    ],
    lng: 122.12
  },
  {
    name: '环江',
    aliases: [
      '环江'
    ],
    lng: 108.26
  },
  {
    name: '环县',
    aliases: [
      '环县'
    ],
    lng: 107.31
  },
  {
    name: '桓仁',
    aliases: [
      '桓仁'
    ],
    lng: 125.36
  },
  {
    name: '桓台',
    aliases: [
      '桓台'
    ],
    lng: 118.1
  },
  {
    name: '皇姑',
    aliases: [
      '皇姑'
    ],
    lng: 123.41
  },
  {
    name: '黄埔',
    aliases: [
      '黄埔'
    ],
    lng: 113.45
  },
  {
    name: '黄岛',
    aliases: [
      '黄岛'
    ],
    lng: 120
  },
  {
    name: '黄冈',
    aliases: [
      '黄冈'
    ],
    lng: 114.88
  },
  {
    name: '黄骅',
    aliases: [
      '黄骅'
    ],
    lng: 117.34
  },
  {
    name: '黄陵',
    aliases: [
      '黄陵'
    ],
    lng: 109.26
  },
  {
    name: '黄龙',
    aliases: [
      '黄龙'
    ],
    lng: 109.84
  },
  {
    name: '黄梅',
    aliases: [
      '黄梅'
    ],
    lng: 115.94
  },
  {
    name: '黄南',
    aliases: [
      '黄南'
    ],
    lng: 102.02
  },
  {
    name: '黄陂',
    aliases: [
      '黄陂'
    ],
    lng: 114.37
  },
  {
    name: '黄平',
    aliases: [
      '黄平'
    ],
    lng: 107.9
  },
  {
    name: '黄浦',
    aliases: [
      '黄浦'
    ],
    lng: 121.49
  },
  {
    name: '黄山',
    aliases: [
      '黄山'
    ],
    lng: 118.32
  },
  {
    name: '黄山区',
    aliases: [
      '黄山区'
    ],
    lng: 118.14
  },
  {
    name: '黄石',
    aliases: [
      '黄石'
    ],
    lng: 115.08
  },
  {
    name: '黄石港',
    aliases: [
      '黄石港'
    ],
    lng: 115.09
  },
  {
    name: '黄岩',
    aliases: [
      '黄岩'
    ],
    lng: 121.26
  },
  {
    name: '黄州',
    aliases: [
      '黄州'
    ],
    lng: 114.88
  },
  {
    name: '湟源',
    aliases: [
      '湟源'
    ],
    lng: 101.26
  },
  {
    name: '湟中',
    aliases: [
      '湟中'
    ],
    lng: 101.57
  },
  {
    name: '潢川',
    aliases: [
      '潢川'
    ],
    lng: 115.05
  },
  {
    name: '辉南',
    aliases: [
      '辉南'
    ],
    lng: 126.04
  },
  {
    name: '辉县',
    aliases: [
      '辉县'
    ],
    lng: 113.8
  },
  {
    name: '徽县',
    aliases: [
      '徽县'
    ],
    lng: 106.09
  },
  {
    name: '徽州',
    aliases: [
      '徽州'
    ],
    lng: 118.34
  },
  {
    name: '回民',
    aliases: [
      '回民'
    ],
    lng: 111.66
  },
  {
    name: '汇川',
    aliases: [
      '汇川'
    ],
    lng: 106.94
  },
  {
    name: '会昌',
    aliases: [
      '会昌'
    ],
    lng: 115.79
  },
  {
    name: '会东',
    aliases: [
      '会东'
    ],
    lng: 102.58
  },
  {
    name: '会理',
    aliases: [
      '会理'
    ],
    lng: 102.25
  },
  {
    name: '会宁',
    aliases: [
      '会宁'
    ],
    lng: 105.05
  },
  {
    name: '会同',
    aliases: [
      '会同'
    ],
    lng: 109.72
  },
  {
    name: '会泽',
    aliases: [
      '会泽'
    ],
    lng: 103.3
  },
  {
    name: '惠安',
    aliases: [
      '惠安'
    ],
    lng: 118.8
  },
  {
    name: '惠城',
    aliases: [
      '惠城'
    ],
    lng: 114.41
  },
  {
    name: '惠东',
    aliases: [
      '惠东'
    ],
    lng: 114.72
  },
  {
    name: '惠济',
    aliases: [
      '惠济'
    ],
    lng: 113.62
  },
  {
    name: '惠来',
    aliases: [
      '惠来'
    ],
    lng: 116.3
  },
  {
    name: '惠民',
    aliases: [
      '惠民'
    ],
    lng: 117.51
  },
  {
    name: '惠农',
    aliases: [
      '惠农'
    ],
    lng: 106.78
  },
  {
    name: '惠山',
    aliases: [
      '惠山'
    ],
    lng: 120.3
  },
  {
    name: '惠水',
    aliases: [
      '惠水'
    ],
    lng: 106.66
  },
  {
    name: '惠阳',
    aliases: [
      '惠阳'
    ],
    lng: 114.47
  },
  {
    name: '惠州',
    aliases: [
      '惠州'
    ],
    lng: 114.41
  },
  {
    name: '浑江',
    aliases: [
      '浑江'
    ],
    lng: 126.43
  },
  {
    name: '浑南',
    aliases: [
      '浑南'
    ],
    lng: 123.46
  },
  {
    name: '浑源',
    aliases: [
      '浑源'
    ],
    lng: 113.7
  },
  {
    name: '珲春',
    aliases: [
      '珲春'
    ],
    lng: 130.37
  },
  {
    name: '获嘉',
    aliases: [
      '获嘉'
    ],
    lng: 113.66
  },
  {
    name: '霍城',
    aliases: [
      '霍城'
    ],
    lng: 80.87
  },
  {
    name: '霍尔果斯',
    aliases: [
      '霍尔果斯'
    ],
    lng: 80.42
  },
  {
    name: '霍林郭勒',
    aliases: [
      '霍林郭勒'
    ],
    lng: 119.66
  },
  {
    name: '霍邱',
    aliases: [
      '霍邱'
    ],
    lng: 116.28
  },
  {
    name: '霍山',
    aliases: [
      '霍山'
    ],
    lng: 116.33
  },
  {
    name: '霍州',
    aliases: [
      '霍州'
    ],
    lng: 111.72
  },
  {
    name: '鸡东',
    aliases: [
      '鸡东'
    ],
    lng: 131.15
  },
  {
    name: '鸡冠',
    aliases: [
      '鸡冠'
    ],
    lng: 130.97
  },
  {
    name: '鸡西',
    aliases: [
      '鸡西'
    ],
    lng: 130.98
  },
  {
    name: '鸡泽',
    aliases: [
      '鸡泽'
    ],
    lng: 114.88
  },
  {
    name: '积石山',
    aliases: [
      '积石山'
    ],
    lng: 102.88
  },
  {
    name: '吉安',
    aliases: [
      '吉安'
    ],
    lng: 114.99
  },
  {
    name: '吉安县',
    aliases: [
      '吉安县'
    ],
    lng: 114.91
  },
  {
    name: '吉利',
    aliases: [
      '吉利'
    ],
    lng: 112.58
  },
  {
    name: '吉林',
    aliases: [
      '吉林'
    ],
    lng: 126.55
  },
  {
    name: '吉隆',
    aliases: [
      '吉隆'
    ],
    lng: 85.3
  },
  {
    name: '吉木乃',
    aliases: [
      '吉木乃'
    ],
    lng: 85.88
  },
  {
    name: '吉木萨尔',
    aliases: [
      '吉木萨尔'
    ],
    lng: 89.18
  },
  {
    name: '吉首',
    aliases: [
      '吉首'
    ],
    lng: 109.74
  },
  {
    name: '吉水',
    aliases: [
      '吉水'
    ],
    lng: 115.13
  },
  {
    name: '吉县',
    aliases: [
      '吉县'
    ],
    lng: 110.68
  },
  {
    name: '吉阳',
    aliases: [
      '吉阳'
    ],
    lng: 109.51
  },
  {
    name: '吉州',
    aliases: [
      '吉州'
    ],
    lng: 114.99
  },
  {
    name: '即墨',
    aliases: [
      '即墨'
    ],
    lng: 120.45
  },
  {
    name: '集安',
    aliases: [
      '集安'
    ],
    lng: 126.19
  },
  {
    name: '集美',
    aliases: [
      '集美'
    ],
    lng: 118.1
  },
  {
    name: '集宁',
    aliases: [
      '集宁'
    ],
    lng: 113.12
  },
  {
    name: '集贤',
    aliases: [
      '集贤'
    ],
    lng: 131.14
  },
  {
    name: '济南',
    aliases: [
      '济南'
    ],
    lng: 117
  },
  {
    name: '济宁',
    aliases: [
      '济宁'
    ],
    lng: 116.59
  },
  {
    name: '济阳',
    aliases: [
      '济阳'
    ],
    lng: 117.18
  },
  {
    name: '济源',
    aliases: [
      '济源'
    ],
    lng: 112.59
  },
  {
    name: '绩溪',
    aliases: [
      '绩溪'
    ],
    lng: 118.59
  },
  {
    name: '蓟州',
    aliases: [
      '蓟州'
    ],
    lng: 117.41
  },
  {
    name: '稷山',
    aliases: [
      '稷山'
    ],
    lng: 110.98
  },
  {
    name: '冀州',
    aliases: [
      '冀州'
    ],
    lng: 115.58
  },
  {
    name: '加查',
    aliases: [
      '加查'
    ],
    lng: 92.59
  },
  {
    name: '夹江',
    aliases: [
      '夹江'
    ],
    lng: 103.58
  },
  {
    name: '伽师',
    aliases: [
      '伽师'
    ],
    lng: 76.74
  },
  {
    name: '佳木斯',
    aliases: [
      '佳木斯'
    ],
    lng: 130.36
  },
  {
    name: '佳县',
    aliases: [
      '佳县'
    ],
    lng: 110.49
  },
  {
    name: '茄子河',
    aliases: [
      '茄子河'
    ],
    lng: 131.07
  },
  {
    name: '嘉定',
    aliases: [
      '嘉定'
    ],
    lng: 121.25
  },
  {
    name: '嘉禾',
    aliases: [
      '嘉禾'
    ],
    lng: 112.37
  },
  {
    name: '嘉黎',
    aliases: [
      '嘉黎'
    ],
    lng: 93.23
  },
  {
    name: '嘉陵',
    aliases: [
      '嘉陵'
    ],
    lng: 106.07
  },
  {
    name: '嘉善',
    aliases: [
      '嘉善'
    ],
    lng: 120.92
  },
  {
    name: '嘉祥',
    aliases: [
      '嘉祥'
    ],
    lng: 116.34
  },
  {
    name: '嘉兴',
    aliases: [
      '嘉兴'
    ],
    lng: 120.75
  },
  {
    name: '嘉义',
    aliases: [
      '嘉义'
    ],
    lng: 120.44
  },
  {
    name: '嘉荫',
    aliases: [
      '嘉荫'
    ],
    lng: 130.4
  },
  {
    name: '嘉鱼',
    aliases: [
      '嘉鱼'
    ],
    lng: 113.92
  },
  {
    name: '嘉峪关',
    aliases: [
      '嘉峪关'
    ],
    lng: 98.28
  },
  {
    name: '郏县',
    aliases: [
      '郏县'
    ],
    lng: 113.22
  },
  {
    name: '贾汪',
    aliases: [
      '贾汪'
    ],
    lng: 117.45
  },
  {
    name: '尖草坪区',
    aliases: [
      '尖草坪区'
    ],
    lng: 112.49
  },
  {
    name: '尖山',
    aliases: [
      '尖山'
    ],
    lng: 131.16
  },
  {
    name: '尖扎',
    aliases: [
      '尖扎'
    ],
    lng: 102.03
  },
  {
    name: '监利',
    aliases: [
      '监利'
    ],
    lng: 112.9
  },
  {
    name: '犍为',
    aliases: [
      '犍为'
    ],
    lng: 103.94
  },
  {
    name: '简阳',
    aliases: [
      '简阳'
    ],
    lng: 104.55
  },
  {
    name: '建昌',
    aliases: [
      '建昌'
    ],
    lng: 119.81
  },
  {
    name: '建德',
    aliases: [
      '建德'
    ],
    lng: 119.28
  },
  {
    name: '建湖',
    aliases: [
      '建湖'
    ],
    lng: 119.79
  },
  {
    name: '建华',
    aliases: [
      '建华'
    ],
    lng: 123.96
  },
  {
    name: '建宁',
    aliases: [
      '建宁'
    ],
    lng: 116.85
  },
  {
    name: '建瓯',
    aliases: [
      '建瓯'
    ],
    lng: 118.32
  },
  {
    name: '建平县',
    aliases: [
      '建平县'
    ],
    lng: 119.64
  },
  {
    name: '建始',
    aliases: [
      '建始'
    ],
    lng: 109.72
  },
  {
    name: '建水',
    aliases: [
      '建水'
    ],
    lng: 102.82
  },
  {
    name: '建阳',
    aliases: [
      '建阳'
    ],
    lng: 118.12
  },
  {
    name: '建邺',
    aliases: [
      '建邺'
    ],
    lng: 118.73
  },
  {
    name: '剑川',
    aliases: [
      '剑川'
    ],
    lng: 99.91
  },
  {
    name: '剑阁',
    aliases: [
      '剑阁'
    ],
    lng: 105.53
  },
  {
    name: '剑河',
    aliases: [
      '剑河'
    ],
    lng: 108.44
  },
  {
    name: '涧西',
    aliases: [
      '涧西'
    ],
    lng: 112.4
  },
  {
    name: '江安',
    aliases: [
      '江安'
    ],
    lng: 105.07
  },
  {
    name: '江岸',
    aliases: [
      '江岸'
    ],
    lng: 114.3
  },
  {
    name: '江川',
    aliases: [
      '江川'
    ],
    lng: 102.75
  },
  {
    name: '江达',
    aliases: [
      '江达'
    ],
    lng: 98.22
  },
  {
    name: '江东',
    aliases: [
      '江东'
    ],
    lng: 121.57
  },
  {
    name: '江都',
    aliases: [
      '江都'
    ],
    lng: 119.57
  },
  {
    name: '江干',
    aliases: [
      '江干'
    ],
    lng: 120.2
  },
  {
    name: '江海',
    aliases: [
      '江海'
    ],
    lng: 113.12
  },
  {
    name: '江汉',
    aliases: [
      '江汉'
    ],
    lng: 114.28
  },
  {
    name: '江华',
    aliases: [
      '江华'
    ],
    lng: 111.58
  },
  {
    name: '江津',
    aliases: [
      '江津'
    ],
    lng: 106.25
  },
  {
    name: '江口',
    aliases: [
      '江口'
    ],
    lng: 108.85
  },
  {
    name: '江陵',
    aliases: [
      '江陵'
    ],
    lng: 112.42
  },
  {
    name: '江门',
    aliases: [
      '江门'
    ],
    lng: 113.09
  },
  {
    name: '江南',
    aliases: [
      '江南'
    ],
    lng: 108.31
  },
  {
    name: '江宁',
    aliases: [
      '江宁'
    ],
    lng: 118.85
  },
  {
    name: '江山',
    aliases: [
      '江山'
    ],
    lng: 118.63
  },
  {
    name: '江夏',
    aliases: [
      '江夏'
    ],
    lng: 114.31
  },
  {
    name: '江阳',
    aliases: [
      '江阳'
    ],
    lng: 105.45
  },
  {
    name: '江阴',
    aliases: [
      '江阴'
    ],
    lng: 120.28
  },
  {
    name: '江永',
    aliases: [
      '江永'
    ],
    lng: 111.35
  },
  {
    name: '江油',
    aliases: [
      '江油'
    ],
    lng: 104.74
  },
  {
    name: '江源',
    aliases: [
      '江源'
    ],
    lng: 126.58
  },
  {
    name: '江州',
    aliases: [
      '江州'
    ],
    lng: 107.35
  },
  {
    name: '江孜',
    aliases: [
      '江孜'
    ],
    lng: 89.61
  },
  {
    name: '姜堰',
    aliases: [
      '姜堰'
    ],
    lng: 120.15
  },
  {
    name: '将乐',
    aliases: [
      '将乐'
    ],
    lng: 117.47
  },
  {
    name: '绛县',
    aliases: [
      '绛县'
    ],
    lng: 111.58
  },
  {
    name: '交城',
    aliases: [
      '交城'
    ],
    lng: 112.16
  },
  {
    name: '交口',
    aliases: [
      '交口'
    ],
    lng: 111.18
  },
  {
    name: '胶州',
    aliases: [
      '胶州'
    ],
    lng: 120.01
  },
  {
    name: '椒江',
    aliases: [
      '椒江'
    ],
    lng: 121.43
  },
  {
    name: '焦作',
    aliases: [
      '焦作'
    ],
    lng: 113.24
  },
  {
    name: '蛟河',
    aliases: [
      '蛟河'
    ],
    lng: 127.34
  },
  {
    name: '蕉城',
    aliases: [
      '蕉城'
    ],
    lng: 119.53
  },
  {
    name: '蕉岭',
    aliases: [
      '蕉岭'
    ],
    lng: 116.17
  },
  {
    name: '揭东',
    aliases: [
      '揭东'
    ],
    lng: 116.41
  },
  {
    name: '揭西',
    aliases: [
      '揭西'
    ],
    lng: 115.84
  },
  {
    name: '揭阳',
    aliases: [
      '揭阳'
    ],
    lng: 116.36
  },
  {
    name: '解放',
    aliases: [
      '解放'
    ],
    lng: 113.23
  },
  {
    name: '介休',
    aliases: [
      '介休'
    ],
    lng: 111.91
  },
  {
    name: '界首',
    aliases: [
      '界首'
    ],
    lng: 115.36
  },
  {
    name: '金安',
    aliases: [
      '金安'
    ],
    lng: 116.5
  },
  {
    name: '金昌',
    aliases: [
      '金昌'
    ],
    lng: 102.19
  },
  {
    name: '金城江',
    aliases: [
      '金城江'
    ],
    lng: 108.06
  },
  {
    name: '金川',
    aliases: [
      '金川'
    ],
    lng: 102.13
  },
  {
    name: '金东',
    aliases: [
      '金东'
    ],
    lng: 119.68
  },
  {
    name: '金凤',
    aliases: [
      '金凤'
    ],
    lng: 106.23
  },
  {
    name: '金湖',
    aliases: [
      '金湖'
    ],
    lng: 119.02
  },
  {
    name: '金华',
    aliases: [
      '金华'
    ],
    lng: 119.65
  },
  {
    name: '金口河',
    aliases: [
      '金口河'
    ],
    lng: 103.08
  },
  {
    name: '金门',
    aliases: [
      '金门'
    ],
    lng: 118.32
  },
  {
    name: '金牛',
    aliases: [
      '金牛'
    ],
    lng: 104.04
  },
  {
    name: '金沙',
    aliases: [
      '金沙'
    ],
    lng: 106.22
  },
  {
    name: '金山',
    aliases: [
      '金山'
    ],
    lng: 121.33
  },
  {
    name: '金山屯',
    aliases: [
      '金山屯'
    ],
    lng: 129.44
  },
  {
    name: '金水',
    aliases: [
      '金水'
    ],
    lng: 113.69
  },
  {
    name: '金塔',
    aliases: [
      '金塔'
    ],
    lng: 98.9
  },
  {
    name: '金台',
    aliases: [
      '金台'
    ],
    lng: 107.15
  },
  {
    name: '金坛',
    aliases: [
      '金坛'
    ],
    lng: 119.57
  },
  {
    name: '金堂',
    aliases: [
      '金堂'
    ],
    lng: 104.42
  },
  {
    name: '金湾',
    aliases: [
      '金湾'
    ],
    lng: 113.35
  },
  {
    name: '金溪',
    aliases: [
      '金溪'
    ],
    lng: 116.78
  },
  {
    name: '金乡',
    aliases: [
      '金乡'
    ],
    lng: 116.31
  },
  {
    name: '金秀',
    aliases: [
      '金秀'
    ],
    lng: 110.19
  },
  {
    name: '金阳',
    aliases: [
      '金阳'
    ],
    lng: 103.25
  },
  {
    name: '金寨',
    aliases: [
      '金寨'
    ],
    lng: 115.88
  },
  {
    name: '金州',
    aliases: [
      '金州'
    ],
    lng: 121.79
  },
  {
    name: '津南',
    aliases: [
      '津南'
    ],
    lng: 117.38
  },
  {
    name: '津市',
    aliases: [
      '津市'
    ],
    lng: 111.88
  },
  {
    name: '锦江',
    aliases: [
      '锦江'
    ],
    lng: 104.08
  },
  {
    name: '锦屏',
    aliases: [
      '锦屏'
    ],
    lng: 109.2
  },
  {
    name: '锦州',
    aliases: [
      '锦州'
    ],
    lng: 121.14
  },
  {
    name: '进贤',
    aliases: [
      '进贤'
    ],
    lng: 116.27
  },
  {
    name: '晋安',
    aliases: [
      '晋安'
    ],
    lng: 119.33
  },
  {
    name: '晋城',
    aliases: [
      '晋城'
    ],
    lng: 112.85
  },
  {
    name: '晋江',
    aliases: [
      '晋江'
    ],
    lng: 118.58
  },
  {
    name: '晋宁',
    aliases: [
      '晋宁'
    ],
    lng: 102.59
  },
  {
    name: '晋源',
    aliases: [
      '晋源'
    ],
    lng: 112.48
  },
  {
    name: '晋中',
    aliases: [
      '晋中'
    ],
    lng: 112.74
  },
  {
    name: '晋州',
    aliases: [
      '晋州'
    ],
    lng: 115.04
  },
  {
    name: '缙云',
    aliases: [
      '缙云'
    ],
    lng: 120.08
  },
  {
    name: '京口',
    aliases: [
      '京口'
    ],
    lng: 119.45
  },
  {
    name: '京山',
    aliases: [
      '京山'
    ],
    lng: 113.11
  },
  {
    name: '泾川',
    aliases: [
      '泾川'
    ],
    lng: 107.37
  },
  {
    name: '泾县',
    aliases: [
      '泾县'
    ],
    lng: 118.41
  },
  {
    name: '泾阳',
    aliases: [
      '泾阳'
    ],
    lng: 108.84
  },
  {
    name: '泾源',
    aliases: [
      '泾源'
    ],
    lng: 106.34
  },
  {
    name: '荆门',
    aliases: [
      '荆门'
    ],
    lng: 112.2
  },
  {
    name: '荆州',
    aliases: [
      '荆州'
    ],
    lng: 112.24
  },
  {
    name: '旌德',
    aliases: [
      '旌德'
    ],
    lng: 118.54
  },
  {
    name: '旌阳',
    aliases: [
      '旌阳'
    ],
    lng: 104.39
  },
  {
    name: '精河',
    aliases: [
      '精河'
    ],
    lng: 82.89
  },
  {
    name: '井冈山',
    aliases: [
      '井冈山'
    ],
    lng: 114.28
  },
  {
    name: '井陉',
    aliases: [
      '井陉'
    ],
    lng: 114.14
  },
  {
    name: '井陉矿区',
    aliases: [
      '井陉矿区'
    ],
    lng: 114.06
  },
  {
    name: '井研',
    aliases: [
      '井研'
    ],
    lng: 104.07
  },
  {
    name: '景德镇',
    aliases: [
      '景德镇'
    ],
    lng: 117.21
  },
  {
    name: '景东',
    aliases: [
      '景东'
    ],
    lng: 100.84
  },
  {
    name: '景谷',
    aliases: [
      '景谷'
    ],
    lng: 100.7
  },
  {
    name: '景洪',
    aliases: [
      '景洪'
    ],
    lng: 100.8
  },
  {
    name: '景宁',
    aliases: [
      '景宁'
    ],
    lng: 119.63
  },
  {
    name: '景泰',
    aliases: [
      '景泰'
    ],
    lng: 104.07
  },
  {
    name: '景县',
    aliases: [
      '景县'
    ],
    lng: 116.26
  },
  {
    name: '竞秀',
    aliases: [
      '竞秀'
    ],
    lng: 115.47
  },
  {
    name: '靖安',
    aliases: [
      '靖安'
    ],
    lng: 115.36
  },
  {
    name: '靖边',
    aliases: [
      '靖边'
    ],
    lng: 108.81
  },
  {
    name: '靖江',
    aliases: [
      '靖江'
    ],
    lng: 120.27
  },
  {
    name: '靖西',
    aliases: [
      '靖西'
    ],
    lng: 106.42
  },
  {
    name: '靖宇',
    aliases: [
      '靖宇'
    ],
    lng: 126.81
  },
  {
    name: '靖远',
    aliases: [
      '靖远'
    ],
    lng: 104.69
  },
  {
    name: '靖州',
    aliases: [
      '靖州'
    ],
    lng: 109.69
  },
  {
    name: '静安',
    aliases: [
      '静安'
    ],
    lng: 121.45
  },
  {
    name: '静海',
    aliases: [
      '静海'
    ],
    lng: 116.93
  },
  {
    name: '静乐',
    aliases: [
      '静乐'
    ],
    lng: 111.94
  },
  {
    name: '静宁',
    aliases: [
      '静宁'
    ],
    lng: 105.73
  },
  {
    name: '镜湖',
    aliases: [
      '镜湖'
    ],
    lng: 118.38
  },
  {
    name: '鸠江',
    aliases: [
      '鸠江'
    ],
    lng: 118.4
  },
  {
    name: '九华山',
    aliases: [
      '九华山'
    ],
    lng: 117.47
  },
  {
    name: '九江',
    aliases: [
      '九江'
    ],
    lng: 115.99
  },
  {
    name: '九龙坡',
    aliases: [
      '九龙坡'
    ],
    lng: 106.48
  },
  {
    name: '九台',
    aliases: [
      '九台'
    ],
    lng: 125.84
  },
  {
    name: '九原',
    aliases: [
      '九原'
    ],
    lng: 109.97
  },
  {
    name: '九寨沟',
    aliases: [
      '九寨沟'
    ],
    lng: 104.24
  },
  {
    name: '久治',
    aliases: [
      '久治'
    ],
    lng: 101.48
  },
  {
    name: '酒泉',
    aliases: [
      '酒泉'
    ],
    lng: 98.51
  },
  {
    name: '莒南',
    aliases: [
      '莒南'
    ],
    lng: 118.84
  },
  {
    name: '莒县',
    aliases: [
      '莒县'
    ],
    lng: 118.83
  },
  {
    name: '巨鹿',
    aliases: [
      '巨鹿'
    ],
    lng: 115.04
  },
  {
    name: '巨野',
    aliases: [
      '巨野'
    ],
    lng: 116.09
  },
  {
    name: '句容',
    aliases: [
      '句容'
    ],
    lng: 119.17
  },
  {
    name: '鄄城',
    aliases: [
      '鄄城'
    ],
    lng: 115.51
  },
  {
    name: '君山',
    aliases: [
      '君山'
    ],
    lng: 113
  },
  {
    name: '浚县',
    aliases: [
      '浚县'
    ],
    lng: 114.55
  },
  {
    name: '喀喇沁',
    aliases: [
      '喀喇沁'
    ],
    lng: 118.71
  },
  {
    name: '喀什',
    aliases: [
      '喀什'
    ],
    lng: 75.99
  },
  {
    name: '喀左',
    aliases: [
      '喀左'
    ],
    lng: 119.43
  },
  {
    name: '卡若',
    aliases: [
      '卡若'
    ],
    lng: 97.18
  },
  {
    name: '开封',
    aliases: [
      '开封'
    ],
    lng: 114.34
  },
  {
    name: '开福',
    aliases: [
      '开福'
    ],
    lng: 112.99
  },
  {
    name: '开化',
    aliases: [
      '开化'
    ],
    lng: 118.41
  },
  {
    name: '开江',
    aliases: [
      '开江'
    ],
    lng: 107.86
  },
  {
    name: '开鲁',
    aliases: [
      '开鲁'
    ],
    lng: 121.31
  },
  {
    name: '开县',
    aliases: [
      '开县'
    ],
    lng: 108.26
  },
  {
    name: '开阳',
    aliases: [
      '开阳'
    ],
    lng: 106.97
  },
  {
    name: '开原',
    aliases: [
      '开原'
    ],
    lng: 124.05
  },
  {
    name: '开远',
    aliases: [
      '开远'
    ],
    lng: 103.26
  },
  {
    name: '开州',
    aliases: [
      '开州'
    ],
    lng: 108.41
  },
  {
    name: '凯里',
    aliases: [
      '凯里'
    ],
    lng: 107.98
  },
  {
    name: '康保',
    aliases: [
      '康保'
    ],
    lng: 114.62
  },
  {
    name: '康定',
    aliases: [
      '康定'
    ],
    lng: 101.96
  },
  {
    name: '康乐',
    aliases: [
      '康乐'
    ],
    lng: 103.71
  },
  {
    name: '康马',
    aliases: [
      '康马'
    ],
    lng: 89.68
  },
  {
    name: '康平',
    aliases: [
      '康平'
    ],
    lng: 123.35
  },
  {
    name: '康县',
    aliases: [
      '康县'
    ],
    lng: 105.61
  },
  {
    name: '柯城',
    aliases: [
      '柯城'
    ],
    lng: 118.87
  },
  {
    name: '柯坪',
    aliases: [
      '柯坪'
    ],
    lng: 79.05
  },
  {
    name: '柯桥',
    aliases: [
      '柯桥'
    ],
    lng: 120.48
  },
  {
    name: '科尔沁',
    aliases: [
      '科尔沁'
    ],
    lng: 121.47
  },
  {
    name: '科右前旗',
    aliases: [
      '科右前旗'
    ],
    lng: 122.07
  },
  {
    name: '科右中旗',
    aliases: [
      '科右中旗'
    ],
    lng: 121.28
  },
  {
    name: '科左后旗',
    aliases: [
      '科左后旗'
    ],
    lng: 122.21
  },
  {
    name: '科左中旗',
    aliases: [
      '科左中旗'
    ],
    lng: 123.18
  },
  {
    name: '可克达拉',
    aliases: [
      '可克达拉'
    ],
    lng: 80.64
  },
  {
    name: '岢岚',
    aliases: [
      '岢岚'
    ],
    lng: 111.57
  },
  {
    name: '克东',
    aliases: [
      '克东'
    ],
    lng: 126.25
  },
  {
    name: '克拉玛依',
    aliases: [
      '克拉玛依'
    ],
    lng: 84.87
  },
  {
    name: '克山',
    aliases: [
      '克山'
    ],
    lng: 125.87
  },
  {
    name: '克什克腾',
    aliases: [
      '克什克腾'
    ],
    lng: 117.54
  },
  {
    name: '克州',
    aliases: [
      '克州'
    ],
    lng: 76.18
  },
  {
    name: '垦利',
    aliases: [
      '垦利'
    ],
    lng: 118.55
  },
  {
    name: '崆峒',
    aliases: [
      '崆峒'
    ],
    lng: 106.68
  },
  {
    name: '库车',
    aliases: [
      '库车'
    ],
    lng: 82.96
  },
  {
    name: '库尔勒',
    aliases: [
      '库尔勒'
    ],
    lng: 86.15
  },
  {
    name: '库伦',
    aliases: [
      '库伦'
    ],
    lng: 121.77
  },
  {
    name: '宽甸',
    aliases: [
      '宽甸'
    ],
    lng: 124.78
  },
  {
    name: '矿区',
    aliases: [
      '矿区'
    ],
    lng: 113.36
  },
  {
    name: '奎屯',
    aliases: [
      '奎屯'
    ],
    lng: 84.9
  },
  {
    name: '奎文',
    aliases: [
      '奎文'
    ],
    lng: 119.14
  },
  {
    name: '昆都仑',
    aliases: [
      '昆都仑'
    ],
    lng: 109.82
  },
  {
    name: '昆明',
    aliases: [
      '昆明'
    ],
    lng: 102.71
  },
  {
    name: '昆山',
    aliases: [
      '昆山'
    ],
    lng: 120.96
  },
  {
    name: '拉萨',
    aliases: [
      '拉萨'
    ],
    lng: 91.13
  },
  {
    name: '拉孜',
    aliases: [
      '拉孜'
    ],
    lng: 87.64
  },
  {
    name: '来安',
    aliases: [
      '来安'
    ],
    lng: 118.43
  },
  {
    name: '来宾',
    aliases: [
      '来宾'
    ],
    lng: 109.23
  },
  {
    name: '来凤',
    aliases: [
      '来凤'
    ],
    lng: 109.41
  },
  {
    name: '涞水',
    aliases: [
      '涞水'
    ],
    lng: 115.71
  },
  {
    name: '涞源',
    aliases: [
      '涞源'
    ],
    lng: 114.69
  },
  {
    name: '莱城',
    aliases: [
      '莱城'
    ],
    lng: 117.68
  },
  {
    name: '莱山',
    aliases: [
      '莱山'
    ],
    lng: 121.45
  },
  {
    name: '莱芜',
    aliases: [
      '莱芜'
    ],
    lng: 117.68
  },
  {
    name: '莱西',
    aliases: [
      '莱西'
    ],
    lng: 120.53
  },
  {
    name: '莱阳',
    aliases: [
      '莱阳'
    ],
    lng: 120.71
  },
  {
    name: '莱州',
    aliases: [
      '莱州'
    ],
    lng: 119.94
  },
  {
    name: '兰考',
    aliases: [
      '兰考'
    ],
    lng: 114.82
  },
  {
    name: '兰陵',
    aliases: [
      '兰陵'
    ],
    lng: 118.05
  },
  {
    name: '兰坪',
    aliases: [
      '兰坪'
    ],
    lng: 99.42
  },
  {
    name: '兰山',
    aliases: [
      '兰山'
    ],
    lng: 118.33
  },
  {
    name: '兰西',
    aliases: [
      '兰西'
    ],
    lng: 126.29
  },
  {
    name: '兰溪',
    aliases: [
      '兰溪'
    ],
    lng: 119.46
  },
  {
    name: '兰州',
    aliases: [
      '兰州'
    ],
    lng: 103.82
  },
  {
    name: '岚皋',
    aliases: [
      '岚皋'
    ],
    lng: 108.9
  },
  {
    name: '岚山',
    aliases: [
      '岚山'
    ],
    lng: 119.32
  },
  {
    name: '岚县',
    aliases: [
      '岚县'
    ],
    lng: 111.67
  },
  {
    name: '蓝山',
    aliases: [
      '蓝山'
    ],
    lng: 112.19
  },
  {
    name: '蓝田',
    aliases: [
      '蓝田'
    ],
    lng: 109.32
  },
  {
    name: '澜沧',
    aliases: [
      '澜沧'
    ],
    lng: 99.93
  },
  {
    name: '郎溪',
    aliases: [
      '郎溪'
    ],
    lng: 119.19
  },
  {
    name: '廊坊',
    aliases: [
      '廊坊'
    ],
    lng: 116.7
  },
  {
    name: '琅琊',
    aliases: [
      '琅琊'
    ],
    lng: 118.32
  },
  {
    name: '朗县',
    aliases: [
      '朗县'
    ],
    lng: 93.07
  },
  {
    name: '浪卡子',
    aliases: [
      '浪卡子'
    ],
    lng: 90.4
  },
  {
    name: '阆中',
    aliases: [
      '阆中'
    ],
    lng: 105.98
  },
  {
    name: '崂山',
    aliases: [
      '崂山'
    ],
    lng: 120.47
  },
  {
    name: '老边',
    aliases: [
      '老边'
    ],
    lng: 122.38
  },
  {
    name: '老城',
    aliases: [
      '老城'
    ],
    lng: 112.48
  },
  {
    name: '老河口',
    aliases: [
      '老河口'
    ],
    lng: 111.68
  },
  {
    name: '乐安',
    aliases: [
      '乐安'
    ],
    lng: 115.84
  },
  {
    name: '乐昌',
    aliases: [
      '乐昌'
    ],
    lng: 113.35
  },
  {
    name: '乐东',
    aliases: [
      '乐东'
    ],
    lng: 109.18
  },
  {
    name: '乐都',
    aliases: [
      '乐都'
    ],
    lng: 102.4
  },
  {
    name: '乐陵',
    aliases: [
      '乐陵'
    ],
    lng: 117.22
  },
  {
    name: '乐平',
    aliases: [
      '乐平'
    ],
    lng: 117.13
  },
  {
    name: '乐清',
    aliases: [
      '乐清'
    ],
    lng: 120.97
  },
  {
    name: '乐山',
    aliases: [
      '乐山'
    ],
    lng: 103.76
  },
  {
    name: '乐亭',
    aliases: [
      '乐亭'
    ],
    lng: 118.91
  },
  {
    name: '乐业',
    aliases: [
      '乐业'
    ],
    lng: 106.56
  },
  {
    name: '乐至',
    aliases: [
      '乐至'
    ],
    lng: 105.03
  },
  {
    name: '雷波',
    aliases: [
      '雷波'
    ],
    lng: 103.57
  },
  {
    name: '雷山',
    aliases: [
      '雷山'
    ],
    lng: 108.08
  },
  {
    name: '雷州',
    aliases: [
      '雷州'
    ],
    lng: 110.09
  },
  {
    name: '耒阳',
    aliases: [
      '耒阳'
    ],
    lng: 112.85
  },
  {
    name: '类乌齐',
    aliases: [
      '类乌齐'
    ],
    lng: 96.6
  },
  {
    name: '冷湖',
    aliases: [
      '冷湖'
    ],
    lng: 97.37
  },
  {
    name: '冷水江',
    aliases: [
      '冷水江'
    ],
    lng: 111.43
  },
  {
    name: '冷水滩',
    aliases: [
      '冷水滩'
    ],
    lng: 111.61
  },
  {
    name: '离石',
    aliases: [
      '离石'
    ],
    lng: 111.13
  },
  {
    name: '黎城',
    aliases: [
      '黎城'
    ],
    lng: 113.39
  },
  {
    name: '黎川',
    aliases: [
      '黎川'
    ],
    lng: 116.91
  },
  {
    name: '黎平',
    aliases: [
      '黎平'
    ],
    lng: 109.14
  },
  {
    name: '蠡县',
    aliases: [
      '蠡县'
    ],
    lng: 115.58
  },
  {
    name: '礼泉',
    aliases: [
      '礼泉'
    ],
    lng: 108.43
  },
  {
    name: '礼县',
    aliases: [
      '礼县'
    ],
    lng: 105.18
  },
  {
    name: '李沧',
    aliases: [
      '李沧'
    ],
    lng: 120.42
  },
  {
    name: '理塘',
    aliases: [
      '理塘'
    ],
    lng: 100.27
  },
  {
    name: '理县',
    aliases: [
      '理县'
    ],
    lng: 103.17
  },
  {
    name: '鲤城',
    aliases: [
      '鲤城'
    ],
    lng: 118.59
  },
  {
    name: '澧县',
    aliases: [
      '澧县'
    ],
    lng: 111.76
  },
  {
    name: '醴陵',
    aliases: [
      '醴陵'
    ],
    lng: 113.51
  },
  {
    name: '历城',
    aliases: [
      '历城'
    ],
    lng: 117.06
  },
  {
    name: '历下',
    aliases: [
      '历下'
    ],
    lng: 117.04
  },
  {
    name: '立山',
    aliases: [
      '立山'
    ],
    lng: 123.02
  },
  {
    name: '丽江',
    aliases: [
      '丽江'
    ],
    lng: 100.23
  },
  {
    name: '丽水',
    aliases: [
      '丽水'
    ],
    lng: 119.92
  },
  {
    name: '利川',
    aliases: [
      '利川'
    ],
    lng: 108.94
  },
  {
    name: '利津',
    aliases: [
      '利津'
    ],
    lng: 118.25
  },
  {
    name: '利通',
    aliases: [
      '利通'
    ],
    lng: 106.2
  },
  {
    name: '利辛',
    aliases: [
      '利辛'
    ],
    lng: 116.21
  },
  {
    name: '利州',
    aliases: [
      '利州'
    ],
    lng: 105.83
  },
  {
    name: '荔波',
    aliases: [
      '荔波'
    ],
    lng: 107.88
  },
  {
    name: '荔城',
    aliases: [
      '荔城'
    ],
    lng: 119.02
  },
  {
    name: '荔浦',
    aliases: [
      '荔浦'
    ],
    lng: 110.4
  },
  {
    name: '荔湾',
    aliases: [
      '荔湾'
    ],
    lng: 113.24
  },
  {
    name: '溧水',
    aliases: [
      '溧水'
    ],
    lng: 119.03
  },
  {
    name: '溧阳',
    aliases: [
      '溧阳'
    ],
    lng: 119.49
  },
  {
    name: '连城',
    aliases: [
      '连城'
    ],
    lng: 116.76
  },
  {
    name: '连江',
    aliases: [
      '连江'
    ],
    lng: 119.54
  },
  {
    name: '连南',
    aliases: [
      '连南'
    ],
    lng: 112.29
  },
  {
    name: '连平',
    aliases: [
      '连平'
    ],
    lng: 114.5
  },
  {
    name: '连云港',
    aliases: [
      '连云港'
    ],
    lng: 119.18
  },
  {
    name: '连州',
    aliases: [
      '连州'
    ],
    lng: 112.38
  },
  {
    name: '涟水',
    aliases: [
      '涟水'
    ],
    lng: 119.27
  },
  {
    name: '涟源',
    aliases: [
      '涟源'
    ],
    lng: 111.67
  },
  {
    name: '莲池',
    aliases: [
      '莲池'
    ],
    lng: 115.5
  },
  {
    name: '莲都',
    aliases: [
      '莲都'
    ],
    lng: 119.92
  },
  {
    name: '莲湖',
    aliases: [
      '莲湖'
    ],
    lng: 108.93
  },
  {
    name: '莲花',
    aliases: [
      '莲花'
    ],
    lng: 113.96
  },
  {
    name: '廉江',
    aliases: [
      '廉江'
    ],
    lng: 110.28
  },
  {
    name: '良庆',
    aliases: [
      '良庆'
    ],
    lng: 108.32
  },
  {
    name: '凉城',
    aliases: [
      '凉城'
    ],
    lng: 112.5
  },
  {
    name: '凉山',
    aliases: [
      '凉山'
    ],
    lng: 102.26
  },
  {
    name: '凉州',
    aliases: [
      '凉州'
    ],
    lng: 102.63
  },
  {
    name: '梁河',
    aliases: [
      '梁河'
    ],
    lng: 98.3
  },
  {
    name: '梁平',
    aliases: [
      '梁平'
    ],
    lng: 107.8
  },
  {
    name: '梁山',
    aliases: [
      '梁山'
    ],
    lng: 116.09
  },
  {
    name: '梁溪',
    aliases: [
      '梁溪'
    ],
    lng: 120.3
  },
  {
    name: '梁园',
    aliases: [
      '梁园'
    ],
    lng: 115.65
  },
  {
    name: '梁子湖',
    aliases: [
      '梁子湖'
    ],
    lng: 114.68
  },
  {
    name: '两当',
    aliases: [
      '两当'
    ],
    lng: 106.31
  },
  {
    name: '辽阳',
    aliases: [
      '辽阳'
    ],
    lng: 123.18
  },
  {
    name: '辽阳县',
    aliases: [
      '辽阳县'
    ],
    lng: 123.08
  },
  {
    name: '辽源',
    aliases: [
      '辽源'
    ],
    lng: 125.15
  },
  {
    name: '辽中',
    aliases: [
      '辽中'
    ],
    lng: 122.73
  },
  {
    name: '聊城',
    aliases: [
      '聊城'
    ],
    lng: 115.98
  },
  {
    name: '烈山',
    aliases: [
      '烈山'
    ],
    lng: 116.81
  },
  {
    name: '邻水',
    aliases: [
      '邻水'
    ],
    lng: 106.93
  },
  {
    name: '林甸',
    aliases: [
      '林甸'
    ],
    lng: 124.88
  },
  {
    name: '林口',
    aliases: [
      '林口'
    ],
    lng: 130.27
  },
  {
    name: '林西',
    aliases: [
      '林西'
    ],
    lng: 118.06
  },
  {
    name: '林芝',
    aliases: [
      '林芝'
    ],
    lng: 94.36
  },
  {
    name: '林州',
    aliases: [
      '林州'
    ],
    lng: 113.82
  },
  {
    name: '林周',
    aliases: [
      '林周'
    ],
    lng: 91.26
  },
  {
    name: '临安',
    aliases: [
      '临安'
    ],
    lng: 119.72
  },
  {
    name: '临沧',
    aliases: [
      '临沧'
    ],
    lng: 100.09
  },
  {
    name: '临城',
    aliases: [
      '临城'
    ],
    lng: 114.51
  },
  {
    name: '临川',
    aliases: [
      '临川'
    ],
    lng: 116.36
  },
  {
    name: '临汾',
    aliases: [
      '临汾'
    ],
    lng: 111.52
  },
  {
    name: '临高',
    aliases: [
      '临高'
    ],
    lng: 109.69
  },
  {
    name: '临桂',
    aliases: [
      '临桂'
    ],
    lng: 110.21
  },
  {
    name: '临海',
    aliases: [
      '临海'
    ],
    lng: 121.13
  },
  {
    name: '临河',
    aliases: [
      '临河'
    ],
    lng: 107.42
  },
  {
    name: '临江',
    aliases: [
      '临江'
    ],
    lng: 126.92
  },
  {
    name: '临澧',
    aliases: [
      '临澧'
    ],
    lng: 111.65
  },
  {
    name: '临清',
    aliases: [
      '临清'
    ],
    lng: 115.71
  },
  {
    name: '临朐',
    aliases: [
      '临朐'
    ],
    lng: 118.54
  },
  {
    name: '临泉',
    aliases: [
      '临泉'
    ],
    lng: 115.26
  },
  {
    name: '临沭',
    aliases: [
      '临沭'
    ],
    lng: 118.65
  },
  {
    name: '临潭',
    aliases: [
      '临潭'
    ],
    lng: 103.35
  },
  {
    name: '临洮',
    aliases: [
      '临洮'
    ],
    lng: 103.86
  },
  {
    name: '临潼',
    aliases: [
      '临潼'
    ],
    lng: 109.21
  },
  {
    name: '临渭',
    aliases: [
      '临渭'
    ],
    lng: 109.5
  },
  {
    name: '临武',
    aliases: [
      '临武'
    ],
    lng: 112.56
  },
  {
    name: '临西',
    aliases: [
      '临西'
    ],
    lng: 115.5
  },
  {
    name: '临夏',
    aliases: [
      '临夏'
    ],
    lng: 103.21
  },
  {
    name: '临县',
    aliases: [
      '临县'
    ],
    lng: 111
  },
  {
    name: '临湘',
    aliases: [
      '临湘'
    ],
    lng: 113.45
  },
  {
    name: '临翔',
    aliases: [
      '临翔'
    ],
    lng: 100.09
  },
  {
    name: '临猗',
    aliases: [
      '临猗'
    ],
    lng: 110.77
  },
  {
    name: '临沂',
    aliases: [
      '临沂'
    ],
    lng: 118.33
  },
  {
    name: '临邑',
    aliases: [
      '临邑'
    ],
    lng: 116.87
  },
  {
    name: '临颍',
    aliases: [
      '临颍'
    ],
    lng: 113.94
  },
  {
    name: '临泽',
    aliases: [
      '临泽'
    ],
    lng: 100.17
  },
  {
    name: '临漳',
    aliases: [
      '临漳'
    ],
    lng: 114.61
  },
  {
    name: '临淄',
    aliases: [
      '临淄'
    ],
    lng: 118.31
  },
  {
    name: '麟游',
    aliases: [
      '麟游'
    ],
    lng: 107.8
  },
  {
    name: '灵宝',
    aliases: [
      '灵宝'
    ],
    lng: 110.89
  },
  {
    name: '灵璧',
    aliases: [
      '灵璧'
    ],
    lng: 117.55
  },
  {
    name: '灵川',
    aliases: [
      '灵川'
    ],
    lng: 110.33
  },
  {
    name: '灵丘',
    aliases: [
      '灵丘'
    ],
    lng: 114.24
  },
  {
    name: '灵山',
    aliases: [
      '灵山'
    ],
    lng: 109.29
  },
  {
    name: '灵石',
    aliases: [
      '灵石'
    ],
    lng: 111.77
  },
  {
    name: '灵寿',
    aliases: [
      '灵寿'
    ],
    lng: 114.38
  },
  {
    name: '灵台',
    aliases: [
      '灵台'
    ],
    lng: 107.62
  },
  {
    name: '灵武',
    aliases: [
      '灵武'
    ],
    lng: 106.33
  },
  {
    name: '凌海',
    aliases: [
      '凌海'
    ],
    lng: 121.36
  },
  {
    name: '凌河',
    aliases: [
      '凌河'
    ],
    lng: 121.15
  },
  {
    name: '凌源',
    aliases: [
      '凌源'
    ],
    lng: 119.4
  },
  {
    name: '凌云',
    aliases: [
      '凌云'
    ],
    lng: 106.56
  },
  {
    name: '陵城',
    aliases: [
      '陵城'
    ],
    lng: 116.57
  },
  {
    name: '陵川',
    aliases: [
      '陵川'
    ],
    lng: 113.28
  },
  {
    name: '陵水',
    aliases: [
      '陵水'
    ],
    lng: 110.04
  },
  {
    name: '零陵',
    aliases: [
      '零陵'
    ],
    lng: 111.63
  },
  {
    name: '岭东',
    aliases: [
      '岭东'
    ],
    lng: 131.16
  },
  {
    name: '浏阳',
    aliases: [
      '浏阳'
    ],
    lng: 113.63
  },
  {
    name: '留坝',
    aliases: [
      '留坝'
    ],
    lng: 106.92
  },
  {
    name: '柳北',
    aliases: [
      '柳北'
    ],
    lng: 109.41
  },
  {
    name: '柳城',
    aliases: [
      '柳城'
    ],
    lng: 109.25
  },
  {
    name: '柳河',
    aliases: [
      '柳河'
    ],
    lng: 125.74
  },
  {
    name: '柳江',
    aliases: [
      '柳江'
    ],
    lng: 109.33
  },
  {
    name: '柳林',
    aliases: [
      '柳林'
    ],
    lng: 110.9
  },
  {
    name: '柳南',
    aliases: [
      '柳南'
    ],
    lng: 109.4
  },
  {
    name: '柳州',
    aliases: [
      '柳州'
    ],
    lng: 109.41
  },
  {
    name: '六安',
    aliases: [
      '六安'
    ],
    lng: 116.51
  },
  {
    name: '六合',
    aliases: [
      '六合'
    ],
    lng: 118.85
  },
  {
    name: '六盘水',
    aliases: [
      '六盘水'
    ],
    lng: 104.85
  },
  {
    name: '六枝',
    aliases: [
      '六枝'
    ],
    lng: 105.47
  },
  {
    name: '龙安',
    aliases: [
      '龙安'
    ],
    lng: 114.32
  },
  {
    name: '龙城',
    aliases: [
      '龙城'
    ],
    lng: 120.41
  },
  {
    name: '龙川',
    aliases: [
      '龙川'
    ],
    lng: 115.26
  },
  {
    name: '龙凤',
    aliases: [
      '龙凤'
    ],
    lng: 125.15
  },
  {
    name: '龙岗',
    aliases: [
      '龙岗'
    ],
    lng: 114.25
  },
  {
    name: '龙港',
    aliases: [
      '龙港'
    ],
    lng: 120.84
  },
  {
    name: '龙海',
    aliases: [
      '龙海'
    ],
    lng: 117.82
  },
  {
    name: '龙湖',
    aliases: [
      '龙湖'
    ],
    lng: 116.73
  },
  {
    name: '龙华',
    aliases: [
      '龙华'
    ],
    lng: 110.33
  },
  {
    name: '龙江',
    aliases: [
      '龙江'
    ],
    lng: 123.19
  },
  {
    name: '龙井',
    aliases: [
      '龙井'
    ],
    lng: 129.43
  },
  {
    name: '龙口',
    aliases: [
      '龙口'
    ],
    lng: 120.53
  },
  {
    name: '龙里',
    aliases: [
      '龙里'
    ],
    lng: 106.98
  },
  {
    name: '龙陵',
    aliases: [
      '龙陵'
    ],
    lng: 98.69
  },
  {
    name: '龙马潭',
    aliases: [
      '龙马潭'
    ],
    lng: 105.44
  },
  {
    name: '龙门',
    aliases: [
      '龙门'
    ],
    lng: 114.26
  },
  {
    name: '龙南',
    aliases: [
      '龙南'
    ],
    lng: 114.79
  },
  {
    name: '龙泉',
    aliases: [
      '龙泉'
    ],
    lng: 119.13
  },
  {
    name: '龙泉驿',
    aliases: [
      '龙泉驿'
    ],
    lng: 104.27
  },
  {
    name: '龙沙',
    aliases: [
      '龙沙'
    ],
    lng: 123.96
  },
  {
    name: '龙胜',
    aliases: [
      '龙胜'
    ],
    lng: 110.01
  },
  {
    name: '龙潭',
    aliases: [
      '龙潭'
    ],
    lng: 126.56
  },
  {
    name: '龙亭',
    aliases: [
      '龙亭'
    ],
    lng: 114.35
  },
  {
    name: '龙湾',
    aliases: [
      '龙湾'
    ],
    lng: 120.76
  },
  {
    name: '龙圩',
    aliases: [
      '龙圩'
    ],
    lng: 111.25
  },
  {
    name: '龙文',
    aliases: [
      '龙文'
    ],
    lng: 117.67
  },
  {
    name: '龙岩',
    aliases: [
      '龙岩'
    ],
    lng: 117.03
  },
  {
    name: '龙游',
    aliases: [
      '龙游'
    ],
    lng: 119.17
  },
  {
    name: '龙州',
    aliases: [
      '龙州'
    ],
    lng: 106.86
  },
  {
    name: '龙子湖',
    aliases: [
      '龙子湖'
    ],
    lng: 117.38
  },
  {
    name: '隆安',
    aliases: [
      '隆安'
    ],
    lng: 107.69
  },
  {
    name: '隆昌',
    aliases: [
      '隆昌'
    ],
    lng: 105.29
  },
  {
    name: '隆德',
    aliases: [
      '隆德'
    ],
    lng: 106.12
  },
  {
    name: '隆化',
    aliases: [
      '隆化'
    ],
    lng: 117.74
  },
  {
    name: '隆回',
    aliases: [
      '隆回'
    ],
    lng: 111.04
  },
  {
    name: '隆林',
    aliases: [
      '隆林'
    ],
    lng: 105.34
  },
  {
    name: '隆阳',
    aliases: [
      '隆阳'
    ],
    lng: 99.17
  },
  {
    name: '隆尧',
    aliases: [
      '隆尧'
    ],
    lng: 114.78
  },
  {
    name: '隆子',
    aliases: [
      '隆子'
    ],
    lng: 92.46
  },
  {
    name: '陇川',
    aliases: [
      '陇川'
    ],
    lng: 97.79
  },
  {
    name: '陇南',
    aliases: [
      '陇南'
    ],
    lng: 104.93
  },
  {
    name: '陇西',
    aliases: [
      '陇西'
    ],
    lng: 104.64
  },
  {
    name: '陇县',
    aliases: [
      '陇县'
    ],
    lng: 106.86
  },
  {
    name: '娄底',
    aliases: [
      '娄底'
    ],
    lng: 112.01
  },
  {
    name: '娄烦',
    aliases: [
      '娄烦'
    ],
    lng: 111.79
  },
  {
    name: '娄星',
    aliases: [
      '娄星'
    ],
    lng: 112.01
  },
  {
    name: '卢龙',
    aliases: [
      '卢龙'
    ],
    lng: 118.88
  },
  {
    name: '卢氏',
    aliases: [
      '卢氏'
    ],
    lng: 111.05
  },
  {
    name: '庐江',
    aliases: [
      '庐江'
    ],
    lng: 117.29
  },
  {
    name: '庐山',
    aliases: [
      '庐山'
    ],
    lng: 116.04
  },
  {
    name: '庐阳',
    aliases: [
      '庐阳'
    ],
    lng: 117.28
  },
  {
    name: '芦山',
    aliases: [
      '芦山'
    ],
    lng: 102.92
  },
  {
    name: '芦淞',
    aliases: [
      '芦淞'
    ],
    lng: 113.16
  },
  {
    name: '芦溪',
    aliases: [
      '芦溪'
    ],
    lng: 114.04
  },
  {
    name: '泸定',
    aliases: [
      '泸定'
    ],
    lng: 102.23
  },
  {
    name: '泸水',
    aliases: [
      '泸水'
    ],
    lng: 98.85
  },
  {
    name: '泸西',
    aliases: [
      '泸西'
    ],
    lng: 103.76
  },
  {
    name: '泸溪',
    aliases: [
      '泸溪'
    ],
    lng: 110.21
  },
  {
    name: '泸县',
    aliases: [
      '泸县'
    ],
    lng: 105.38
  },
  {
    name: '泸州',
    aliases: [
      '泸州'
    ],
    lng: 105.44
  },
  {
    name: '炉霍',
    aliases: [
      '炉霍'
    ],
    lng: 100.68
  },
  {
    name: '鲁甸',
    aliases: [
      '鲁甸'
    ],
    lng: 103.55
  },
  {
    name: '鲁山',
    aliases: [
      '鲁山'
    ],
    lng: 112.91
  },
  {
    name: '陆川',
    aliases: [
      '陆川'
    ],
    lng: 110.26
  },
  {
    name: '陆丰',
    aliases: [
      '陆丰'
    ],
    lng: 115.64
  },
  {
    name: '陆河',
    aliases: [
      '陆河'
    ],
    lng: 115.66
  },
  {
    name: '陆良',
    aliases: [
      '陆良'
    ],
    lng: 103.66
  },
  {
    name: '鹿城',
    aliases: [
      '鹿城'
    ],
    lng: 120.67
  },
  {
    name: '鹿泉',
    aliases: [
      '鹿泉'
    ],
    lng: 114.32
  },
  {
    name: '鹿邑',
    aliases: [
      '鹿邑'
    ],
    lng: 115.49
  },
  {
    name: '鹿寨',
    aliases: [
      '鹿寨'
    ],
    lng: 109.74
  },
  {
    name: '禄丰',
    aliases: [
      '禄丰'
    ],
    lng: 102.08
  },
  {
    name: '禄劝',
    aliases: [
      '禄劝'
    ],
    lng: 102.47
  },
  {
    name: '碌曲',
    aliases: [
      '碌曲'
    ],
    lng: 102.49
  },
  {
    name: '路北',
    aliases: [
      '路北'
    ],
    lng: 118.17
  },
  {
    name: '路环岛',
    aliases: [
      '路环岛'
    ],
    lng: 113.54
  },
  {
    name: '路南',
    aliases: [
      '路南'
    ],
    lng: 118.21
  },
  {
    name: '路桥',
    aliases: [
      '路桥'
    ],
    lng: 121.37
  },
  {
    name: '潞城',
    aliases: [
      '潞城'
    ],
    lng: 113.22
  },
  {
    name: '吕梁',
    aliases: [
      '吕梁'
    ],
    lng: 111.13
  },
  {
    name: '旅顺',
    aliases: [
      '旅顺'
    ],
    lng: 121.27
  },
  {
    name: '绿春',
    aliases: [
      '绿春'
    ],
    lng: 102.39
  },
  {
    name: '绿园',
    aliases: [
      '绿园'
    ],
    lng: 125.27
  },
  {
    name: '栾城',
    aliases: [
      '栾城'
    ],
    lng: 114.65
  },
  {
    name: '栾川',
    aliases: [
      '栾川'
    ],
    lng: 111.62
  },
  {
    name: '滦南',
    aliases: [
      '滦南'
    ],
    lng: 118.68
  },
  {
    name: '滦平',
    aliases: [
      '滦平'
    ],
    lng: 117.34
  },
  {
    name: '滦县',
    aliases: [
      '滦县'
    ],
    lng: 118.7
  },
  {
    name: '略阳',
    aliases: [
      '略阳'
    ],
    lng: 106.15
  },
  {
    name: '轮台',
    aliases: [
      '轮台'
    ],
    lng: 84.25
  },
  {
    name: '罗城',
    aliases: [
      '罗城'
    ],
    lng: 108.9
  },
  {
    name: '罗甸',
    aliases: [
      '罗甸'
    ],
    lng: 106.75
  },
  {
    name: '罗定',
    aliases: [
      '罗定'
    ],
    lng: 111.58
  },
  {
    name: '罗湖',
    aliases: [
      '罗湖'
    ],
    lng: 114.12
  },
  {
    name: '罗江',
    aliases: [
      '罗江'
    ],
    lng: 104.51
  },
  {
    name: '罗平',
    aliases: [
      '罗平'
    ],
    lng: 104.31
  },
  {
    name: '罗山',
    aliases: [
      '罗山'
    ],
    lng: 114.53
  },
  {
    name: '罗田',
    aliases: [
      '罗田'
    ],
    lng: 115.4
  },
  {
    name: '罗源',
    aliases: [
      '罗源'
    ],
    lng: 119.55
  },
  {
    name: '罗庄',
    aliases: [
      '罗庄'
    ],
    lng: 118.28
  },
  {
    name: '萝北',
    aliases: [
      '萝北'
    ],
    lng: 130.83
  },
  {
    name: '洛川',
    aliases: [
      '洛川'
    ],
    lng: 109.44
  },
  {
    name: '洛江',
    aliases: [
      '洛江'
    ],
    lng: 118.67
  },
  {
    name: '洛龙',
    aliases: [
      '洛龙'
    ],
    lng: 112.46
  },
  {
    name: '洛隆',
    aliases: [
      '洛隆'
    ],
    lng: 95.82
  },
  {
    name: '洛南',
    aliases: [
      '洛南'
    ],
    lng: 110.15
  },
  {
    name: '洛宁',
    aliases: [
      '洛宁'
    ],
    lng: 111.66
  },
  {
    name: '洛浦',
    aliases: [
      '洛浦'
    ],
    lng: 80.18
  },
  {
    name: '洛阳',
    aliases: [
      '洛阳'
    ],
    lng: 112.43
  },
  {
    name: '洛扎',
    aliases: [
      '洛扎'
    ],
    lng: 90.86
  },
  {
    name: '漯河',
    aliases: [
      '漯河'
    ],
    lng: 114.03
  },
  {
    name: '麻城',
    aliases: [
      '麻城'
    ],
    lng: 115.03
  },
  {
    name: '麻江',
    aliases: [
      '麻江'
    ],
    lng: 107.59
  },
  {
    name: '麻栗坡',
    aliases: [
      '麻栗坡'
    ],
    lng: 104.7
  },
  {
    name: '麻山',
    aliases: [
      '麻山'
    ],
    lng: 130.48
  },
  {
    name: '麻阳',
    aliases: [
      '麻阳'
    ],
    lng: 109.8
  },
  {
    name: '麻章',
    aliases: [
      '麻章'
    ],
    lng: 110.33
  },
  {
    name: '马鞍山',
    aliases: [
      '马鞍山'
    ],
    lng: 118.51
  },
  {
    name: '马边',
    aliases: [
      '马边'
    ],
    lng: 103.55
  },
  {
    name: '马村',
    aliases: [
      '马村'
    ],
    lng: 113.32
  },
  {
    name: '马尔康',
    aliases: [
      '马尔康'
    ],
    lng: 102.22
  },
  {
    name: '马关',
    aliases: [
      '马关'
    ],
    lng: 104.4
  },
  {
    name: '马龙',
    aliases: [
      '马龙'
    ],
    lng: 103.58
  },
  {
    name: '马山',
    aliases: [
      '马山'
    ],
    lng: 108.17
  },
  {
    name: '马尾',
    aliases: [
      '马尾'
    ],
    lng: 119.46
  },
  {
    name: '玛多',
    aliases: [
      '玛多'
    ],
    lng: 98.21
  },
  {
    name: '玛纳斯',
    aliases: [
      '玛纳斯'
    ],
    lng: 86.22
  },
  {
    name: '玛沁',
    aliases: [
      '玛沁'
    ],
    lng: 100.24
  },
  {
    name: '玛曲',
    aliases: [
      '玛曲'
    ],
    lng: 102.08
  },
  {
    name: '麦盖提',
    aliases: [
      '麦盖提'
    ],
    lng: 77.65
  },
  {
    name: '麦积',
    aliases: [
      '麦积'
    ],
    lng: 105.9
  },
  {
    name: '满城',
    aliases: [
      '满城'
    ],
    lng: 115.32
  },
  {
    name: '满洲里',
    aliases: [
      '满洲里'
    ],
    lng: 117.46
  },
  {
    name: '芒康',
    aliases: [
      '芒康'
    ],
    lng: 98.6
  },
  {
    name: '芒市',
    aliases: [
      '芒市'
    ],
    lng: 98.58
  },
  {
    name: '茫崖',
    aliases: [
      '茫崖'
    ],
    lng: 90.51
  },
  {
    name: '茅箭',
    aliases: [
      '茅箭'
    ],
    lng: 110.79
  },
  {
    name: '茂名',
    aliases: [
      '茂名'
    ],
    lng: 110.92
  },
  {
    name: '茂南',
    aliases: [
      '茂南'
    ],
    lng: 110.92
  },
  {
    name: '茂县',
    aliases: [
      '茂县'
    ],
    lng: 103.85
  },
  {
    name: '眉山',
    aliases: [
      '眉山'
    ],
    lng: 103.83
  },
  {
    name: '眉县',
    aliases: [
      '眉县'
    ],
    lng: 107.75
  },
  {
    name: '梅河口',
    aliases: [
      '梅河口'
    ],
    lng: 125.69
  },
  {
    name: '梅江',
    aliases: [
      '梅江'
    ],
    lng: 116.12
  },
  {
    name: '梅里斯',
    aliases: [
      '梅里斯'
    ],
    lng: 123.75
  },
  {
    name: '梅列',
    aliases: [
      '梅列'
    ],
    lng: 117.64
  },
  {
    name: '梅县',
    aliases: [
      '梅县'
    ],
    lng: 116.08
  },
  {
    name: '梅州',
    aliases: [
      '梅州'
    ],
    lng: 116.12
  },
  {
    name: '湄潭',
    aliases: [
      '湄潭'
    ],
    lng: 107.49
  },
  {
    name: '美姑',
    aliases: [
      '美姑'
    ],
    lng: 103.13
  },
  {
    name: '美兰',
    aliases: [
      '美兰'
    ],
    lng: 110.36
  },
  {
    name: '美溪',
    aliases: [
      '美溪'
    ],
    lng: 129.13
  },
  {
    name: '门头沟',
    aliases: [
      '门头沟'
    ],
    lng: 116.11
  },
  {
    name: '门源',
    aliases: [
      '门源'
    ],
    lng: 101.62
  },
  {
    name: '蒙城',
    aliases: [
      '蒙城'
    ],
    lng: 116.56
  },
  {
    name: '蒙山',
    aliases: [
      '蒙山'
    ],
    lng: 110.52
  },
  {
    name: '蒙阴',
    aliases: [
      '蒙阴'
    ],
    lng: 117.94
  },
  {
    name: '蒙自',
    aliases: [
      '蒙自'
    ],
    lng: 103.39
  },
  {
    name: '勐海',
    aliases: [
      '勐海'
    ],
    lng: 100.45
  },
  {
    name: '勐腊',
    aliases: [
      '勐腊'
    ],
    lng: 101.57
  },
  {
    name: '孟村',
    aliases: [
      '孟村'
    ],
    lng: 117.11
  },
  {
    name: '孟津',
    aliases: [
      '孟津'
    ],
    lng: 112.44
  },
  {
    name: '孟连',
    aliases: [
      '孟连'
    ],
    lng: 99.59
  },
  {
    name: '孟州',
    aliases: [
      '孟州'
    ],
    lng: 112.79
  },
  {
    name: '弥渡',
    aliases: [
      '弥渡'
    ],
    lng: 100.49
  },
  {
    name: '弥勒',
    aliases: [
      '弥勒'
    ],
    lng: 103.44
  },
  {
    name: '米东',
    aliases: [
      '米东'
    ],
    lng: 87.69
  },
  {
    name: '米林',
    aliases: [
      '米林'
    ],
    lng: 94.21
  },
  {
    name: '米易',
    aliases: [
      '米易'
    ],
    lng: 102.11
  },
  {
    name: '米脂',
    aliases: [
      '米脂'
    ],
    lng: 110.18
  },
  {
    name: '汨罗',
    aliases: [
      '汨罗'
    ],
    lng: 113.08
  },
  {
    name: '泌阳',
    aliases: [
      '泌阳'
    ],
    lng: 113.33
  },
  {
    name: '密山',
    aliases: [
      '密山'
    ],
    lng: 131.87
  },
  {
    name: '密云',
    aliases: [
      '密云'
    ],
    lng: 116.84
  },
  {
    name: '绵阳',
    aliases: [
      '绵阳'
    ],
    lng: 104.74
  },
  {
    name: '绵竹',
    aliases: [
      '绵竹'
    ],
    lng: 104.2
  },
  {
    name: '勉县',
    aliases: [
      '勉县'
    ],
    lng: 106.68
  },
  {
    name: '冕宁',
    aliases: [
      '冕宁'
    ],
    lng: 102.17
  },
  {
    name: '渑池',
    aliases: [
      '渑池'
    ],
    lng: 111.76
  },
  {
    name: '苗栗',
    aliases: [
      '苗栗'
    ],
    lng: 120.81
  },
  {
    name: '民丰',
    aliases: [
      '民丰'
    ],
    lng: 82.69
  },
  {
    name: '民和',
    aliases: [
      '民和'
    ],
    lng: 102.8
  },
  {
    name: '民乐',
    aliases: [
      '民乐'
    ],
    lng: 100.82
  },
  {
    name: '民勤',
    aliases: [
      '民勤'
    ],
    lng: 103.09
  },
  {
    name: '民权',
    aliases: [
      '民权'
    ],
    lng: 115.15
  },
  {
    name: '岷县',
    aliases: [
      '岷县'
    ],
    lng: 104.04
  },
  {
    name: '闵行',
    aliases: [
      '闵行'
    ],
    lng: 121.38
  },
  {
    name: '闽侯',
    aliases: [
      '闽侯'
    ],
    lng: 119.15
  },
  {
    name: '闽清',
    aliases: [
      '闽清'
    ],
    lng: 118.87
  },
  {
    name: '名山',
    aliases: [
      '名山'
    ],
    lng: 103.11
  },
  {
    name: '明光',
    aliases: [
      '明光'
    ],
    lng: 118
  },
  {
    name: '明山',
    aliases: [
      '明山'
    ],
    lng: 123.76
  },
  {
    name: '明水',
    aliases: [
      '明水'
    ],
    lng: 125.91
  },
  {
    name: '明溪',
    aliases: [
      '明溪'
    ],
    lng: 117.2
  },
  {
    name: '莫力达瓦',
    aliases: [
      '莫力达瓦'
    ],
    lng: 124.51
  },
  {
    name: '漠河',
    aliases: [
      '漠河'
    ],
    lng: 122.54
  },
  {
    name: '墨江',
    aliases: [
      '墨江'
    ],
    lng: 101.69
  },
  {
    name: '墨脱',
    aliases: [
      '墨脱'
    ],
    lng: 95.33
  },
  {
    name: '墨玉',
    aliases: [
      '墨玉'
    ],
    lng: 79.74
  },
  {
    name: '墨竹工卡',
    aliases: [
      '墨竹工卡'
    ],
    lng: 91.73
  },
  {
    name: '牟定',
    aliases: [
      '牟定'
    ],
    lng: 101.54
  },
  {
    name: '牟平',
    aliases: [
      '牟平'
    ],
    lng: 121.6
  },
  {
    name: '牡丹',
    aliases: [
      '牡丹'
    ],
    lng: 115.47
  },
  {
    name: '牡丹江',
    aliases: [
      '牡丹江'
    ],
    lng: 129.62
  },
  {
    name: '木兰',
    aliases: [
      '木兰'
    ],
    lng: 128.04
  },
  {
    name: '木垒',
    aliases: [
      '木垒'
    ],
    lng: 90.28
  },
  {
    name: '木里',
    aliases: [
      '木里'
    ],
    lng: 101.28
  },
  {
    name: '沐川',
    aliases: [
      '沐川'
    ],
    lng: 103.9
  },
  {
    name: '牧野',
    aliases: [
      '牧野'
    ],
    lng: 113.9
  },
  {
    name: '穆棱',
    aliases: [
      '穆棱'
    ],
    lng: 130.53
  },
  {
    name: '那坡',
    aliases: [
      '那坡'
    ],
    lng: 105.83
  },
  {
    name: '那曲',
    aliases: [
      '那曲'
    ],
    lng: 92.06
  },
  {
    name: '纳溪',
    aliases: [
      '纳溪'
    ],
    lng: 105.38
  },
  {
    name: '纳雍',
    aliases: [
      '纳雍'
    ],
    lng: 105.38
  },
  {
    name: '乃东',
    aliases: [
      '乃东'
    ],
    lng: 91.77
  },
  {
    name: '奈曼',
    aliases: [
      '奈曼'
    ],
    lng: 120.66
  },
  {
    name: '南安',
    aliases: [
      '南安'
    ],
    lng: 118.39
  },
  {
    name: '南岸',
    aliases: [
      '南岸'
    ],
    lng: 106.56
  },
  {
    name: '南澳',
    aliases: [
      '南澳'
    ],
    lng: 117.03
  },
  {
    name: '南部',
    aliases: [
      '南部'
    ],
    lng: 106.06
  },
  {
    name: '南岔',
    aliases: [
      '南岔'
    ],
    lng: 129.28
  },
  {
    name: '南昌',
    aliases: [
      '南昌'
    ],
    lng: 115.89
  },
  {
    name: '南昌县',
    aliases: [
      '南昌县'
    ],
    lng: 115.94
  },
  {
    name: '南城',
    aliases: [
      '南城'
    ],
    lng: 116.64
  },
  {
    name: '南充',
    aliases: [
      '南充'
    ],
    lng: 106.08
  },
  {
    name: '南川',
    aliases: [
      '南川'
    ],
    lng: 107.1
  },
  {
    name: '南丹',
    aliases: [
      '南丹'
    ],
    lng: 107.55
  },
  {
    name: '南芬',
    aliases: [
      '南芬'
    ],
    lng: 123.75
  },
  {
    name: '南丰',
    aliases: [
      '南丰'
    ],
    lng: 116.53
  },
  {
    name: '南岗',
    aliases: [
      '南岗'
    ],
    lng: 126.65
  },
  {
    name: '南宫',
    aliases: [
      '南宫'
    ],
    lng: 115.4
  },
  {
    name: '南关',
    aliases: [
      '南关'
    ],
    lng: 125.34
  },
  {
    name: '南海',
    aliases: [
      '南海'
    ],
    lng: 113.15
  },
  {
    name: '南和',
    aliases: [
      '南和'
    ],
    lng: 114.69
  },
  {
    name: '南湖',
    aliases: [
      '南湖'
    ],
    lng: 120.75
  },
  {
    name: '南华',
    aliases: [
      '南华'
    ],
    lng: 101.27
  },
  {
    name: '南涧',
    aliases: [
      '南涧'
    ],
    lng: 100.52
  },
  {
    name: '南江',
    aliases: [
      '南江'
    ],
    lng: 106.84
  },
  {
    name: '南郊',
    aliases: [
      '南郊'
    ],
    lng: 113.17
  },
  {
    name: '南京',
    aliases: [
      '南京'
    ],
    lng: 118.77
  },
  {
    name: '南靖',
    aliases: [
      '南靖'
    ],
    lng: 117.37
  },
  {
    name: '南开',
    aliases: [
      '南开'
    ],
    lng: 117.16
  },
  {
    name: '南康',
    aliases: [
      '南康'
    ],
    lng: 114.76
  },
  {
    name: '南乐',
    aliases: [
      '南乐'
    ],
    lng: 115.2
  },
  {
    name: '南陵',
    aliases: [
      '南陵'
    ],
    lng: 118.34
  },
  {
    name: '南明',
    aliases: [
      '南明'
    ],
    lng: 106.72
  },
  {
    name: '南木林',
    aliases: [
      '南木林'
    ],
    lng: 89.1
  },
  {
    name: '南宁',
    aliases: [
      '南宁'
    ],
    lng: 108.32
  },
  {
    name: '南皮',
    aliases: [
      '南皮'
    ],
    lng: 116.71
  },
  {
    name: '南票',
    aliases: [
      '南票'
    ],
    lng: 120.75
  },
  {
    name: '南平',
    aliases: [
      '南平'
    ],
    lng: 118.18
  },
  {
    name: '南谯',
    aliases: [
      '南谯'
    ],
    lng: 118.3
  },
  {
    name: '南市',
    aliases: [
      '南市'
    ],
    lng: 115.5
  },
  {
    name: '南通',
    aliases: [
      '南通'
    ],
    lng: 120.86
  },
  {
    name: '南投',
    aliases: [
      '南投'
    ],
    lng: 120.69
  },
  {
    name: '南溪',
    aliases: [
      '南溪'
    ],
    lng: 104.98
  },
  {
    name: '南县',
    aliases: [
      '南县'
    ],
    lng: 112.41
  },
  {
    name: '南雄',
    aliases: [
      '南雄'
    ],
    lng: 114.31
  },
  {
    name: '南浔',
    aliases: [
      '南浔'
    ],
    lng: 120.42
  },
  {
    name: '南阳',
    aliases: [
      '南阳'
    ],
    lng: 112.54
  },
  {
    name: '南岳',
    aliases: [
      '南岳'
    ],
    lng: 112.73
  },
  {
    name: '南漳',
    aliases: [
      '南漳'
    ],
    lng: 111.84
  },
  {
    name: '南召',
    aliases: [
      '南召'
    ],
    lng: 112.44
  },
  {
    name: '南郑',
    aliases: [
      '南郑'
    ],
    lng: 106.94
  },
  {
    name: '囊谦',
    aliases: [
      '囊谦'
    ],
    lng: 96.48
  },
  {
    name: '讷河',
    aliases: [
      '讷河'
    ],
    lng: 124.88
  },
  {
    name: '内黄',
    aliases: [
      '内黄'
    ],
    lng: 114.9
  },
  {
    name: '内江',
    aliases: [
      '内江'
    ],
    lng: 105.07
  },
  {
    name: '内丘',
    aliases: [
      '内丘'
    ],
    lng: 114.51
  },
  {
    name: '内乡',
    aliases: [
      '内乡'
    ],
    lng: 111.84
  },
  {
    name: '嫩江',
    aliases: [
      '嫩江'
    ],
    lng: 125.23
  },
  {
    name: '尼勒克',
    aliases: [
      '尼勒克'
    ],
    lng: 82.5
  },
  {
    name: '尼玛',
    aliases: [
      '尼玛'
    ],
    lng: 87.24
  },
  {
    name: '尼木',
    aliases: [
      '尼木'
    ],
    lng: 90.17
  },
  {
    name: '碾子山',
    aliases: [
      '碾子山'
    ],
    lng: 122.89
  },
  {
    name: '聂拉木',
    aliases: [
      '聂拉木'
    ],
    lng: 85.98
  },
  {
    name: '聂荣',
    aliases: [
      '聂荣'
    ],
    lng: 92.3
  },
  {
    name: '宁安',
    aliases: [
      '宁安'
    ],
    lng: 129.47
  },
  {
    name: '宁波',
    aliases: [
      '宁波'
    ],
    lng: 121.55
  },
  {
    name: '宁城',
    aliases: [
      '宁城'
    ],
    lng: 119.34
  },
  {
    name: '宁德',
    aliases: [
      '宁德'
    ],
    lng: 119.53
  },
  {
    name: '宁都',
    aliases: [
      '宁都'
    ],
    lng: 116.02
  },
  {
    name: '宁洱',
    aliases: [
      '宁洱'
    ],
    lng: 101.05
  },
  {
    name: '宁国',
    aliases: [
      '宁国'
    ],
    lng: 118.98
  },
  {
    name: '宁海',
    aliases: [
      '宁海'
    ],
    lng: 121.43
  },
  {
    name: '宁河',
    aliases: [
      '宁河'
    ],
    lng: 117.83
  },
  {
    name: '宁化',
    aliases: [
      '宁化'
    ],
    lng: 116.66
  },
  {
    name: '宁江',
    aliases: [
      '宁江'
    ],
    lng: 124.83
  },
  {
    name: '宁津',
    aliases: [
      '宁津'
    ],
    lng: 116.79
  },
  {
    name: '宁晋',
    aliases: [
      '宁晋'
    ],
    lng: 114.92
  },
  {
    name: '宁蒗',
    aliases: [
      '宁蒗'
    ],
    lng: 100.85
  },
  {
    name: '宁陵',
    aliases: [
      '宁陵'
    ],
    lng: 115.32
  },
  {
    name: '宁明',
    aliases: [
      '宁明'
    ],
    lng: 107.07
  },
  {
    name: '宁南',
    aliases: [
      '宁南'
    ],
    lng: 102.76
  },
  {
    name: '宁强',
    aliases: [
      '宁强'
    ],
    lng: 106.26
  },
  {
    name: '宁陕',
    aliases: [
      '宁陕'
    ],
    lng: 108.31
  },
  {
    name: '宁武',
    aliases: [
      '宁武'
    ],
    lng: 112.31
  },
  {
    name: '宁县',
    aliases: [
      '宁县'
    ],
    lng: 107.92
  },
  {
    name: '宁乡',
    aliases: [
      '宁乡'
    ],
    lng: 112.55
  },
  {
    name: '宁阳',
    aliases: [
      '宁阳'
    ],
    lng: 116.8
  },
  {
    name: '宁远',
    aliases: [
      '宁远'
    ],
    lng: 111.94
  },
  {
    name: '农安',
    aliases: [
      '农安'
    ],
    lng: 125.18
  },
  {
    name: '怒江',
    aliases: [
      '怒江'
    ],
    lng: 98.85
  },
  {
    name: '瓯海',
    aliases: [
      '瓯海'
    ],
    lng: 120.64
  },
  {
    name: '潘集',
    aliases: [
      '潘集'
    ],
    lng: 116.82
  },
  {
    name: '攀枝花',
    aliases: [
      '攀枝花'
    ],
    lng: 101.72
  },
  {
    name: '盘锦',
    aliases: [
      '盘锦'
    ],
    lng: 122.07
  },
  {
    name: '盘龙',
    aliases: [
      '盘龙'
    ],
    lng: 102.73
  },
  {
    name: '盘山',
    aliases: [
      '盘山'
    ],
    lng: 121.99
  },
  {
    name: '盘县',
    aliases: [
      '盘县'
    ],
    lng: 104.47
  },
  {
    name: '磐安',
    aliases: [
      '磐安'
    ],
    lng: 120.45
  },
  {
    name: '磐石',
    aliases: [
      '磐石'
    ],
    lng: 126.06
  },
  {
    name: '沛县',
    aliases: [
      '沛县'
    ],
    lng: 116.94
  },
  {
    name: '彭山',
    aliases: [
      '彭山'
    ],
    lng: 103.87
  },
  {
    name: '彭水',
    aliases: [
      '彭水'
    ],
    lng: 108.17
  },
  {
    name: '彭阳',
    aliases: [
      '彭阳'
    ],
    lng: 106.64
  },
  {
    name: '彭泽',
    aliases: [
      '彭泽'
    ],
    lng: 116.56
  },
  {
    name: '彭州',
    aliases: [
      '彭州'
    ],
    lng: 103.94
  },
  {
    name: '蓬安',
    aliases: [
      '蓬安'
    ],
    lng: 106.41
  },
  {
    name: '蓬江',
    aliases: [
      '蓬江'
    ],
    lng: 113.08
  },
  {
    name: '蓬莱',
    aliases: [
      '蓬莱'
    ],
    lng: 120.76
  },
  {
    name: '蓬溪',
    aliases: [
      '蓬溪'
    ],
    lng: 105.71
  },
  {
    name: '邳州',
    aliases: [
      '邳州'
    ],
    lng: 117.96
  },
  {
    name: '皮山',
    aliases: [
      '皮山'
    ],
    lng: 78.28
  },
  {
    name: '郫县',
    aliases: [
      '郫县'
    ],
    lng: 103.89
  },
  {
    name: '偏关',
    aliases: [
      '偏关'
    ],
    lng: 111.5
  },
  {
    name: '平安',
    aliases: [
      '平安'
    ],
    lng: 102.1
  },
  {
    name: '平坝',
    aliases: [
      '平坝'
    ],
    lng: 106.26
  },
  {
    name: '平昌',
    aliases: [
      '平昌'
    ],
    lng: 107.1
  },
  {
    name: '平川',
    aliases: [
      '平川'
    ],
    lng: 104.82
  },
  {
    name: '平顶山',
    aliases: [
      '平顶山'
    ],
    lng: 113.31
  },
  {
    name: '平定',
    aliases: [
      '平定'
    ],
    lng: 113.63
  },
  {
    name: '平度',
    aliases: [
      '平度'
    ],
    lng: 119.96
  },
  {
    name: '平房',
    aliases: [
      '平房'
    ],
    lng: 126.63
  },
  {
    name: '平谷',
    aliases: [
      '平谷'
    ],
    lng: 117.11
  },
  {
    name: '平桂',
    aliases: [
      '平桂'
    ],
    lng: 111.52
  },
  {
    name: '平果',
    aliases: [
      '平果'
    ],
    lng: 107.58
  },
  {
    name: '平和',
    aliases: [
      '平和'
    ],
    lng: 117.31
  },
  {
    name: '平湖',
    aliases: [
      '平湖'
    ],
    lng: 121.01
  },
  {
    name: '平江',
    aliases: [
      '平江'
    ],
    lng: 113.59
  },
  {
    name: '平乐',
    aliases: [
      '平乐'
    ],
    lng: 110.64
  },
  {
    name: '平利',
    aliases: [
      '平利'
    ],
    lng: 109.36
  },
  {
    name: '平凉',
    aliases: [
      '平凉'
    ],
    lng: 106.68
  },
  {
    name: '平鲁',
    aliases: [
      '平鲁'
    ],
    lng: 112.3
  },
  {
    name: '平陆',
    aliases: [
      '平陆'
    ],
    lng: 111.21
  },
  {
    name: '平罗',
    aliases: [
      '平罗'
    ],
    lng: 106.54
  },
  {
    name: '平南',
    aliases: [
      '平南'
    ],
    lng: 110.4
  },
  {
    name: '平桥',
    aliases: [
      '平桥'
    ],
    lng: 114.13
  },
  {
    name: '平泉',
    aliases: [
      '平泉'
    ],
    lng: 118.69
  },
  {
    name: '平顺',
    aliases: [
      '平顺'
    ],
    lng: 113.44
  },
  {
    name: '平潭',
    aliases: [
      '平潭'
    ],
    lng: 119.79
  },
  {
    name: '平塘',
    aliases: [
      '平塘'
    ],
    lng: 107.32
  },
  {
    name: '平武',
    aliases: [
      '平武'
    ],
    lng: 104.53
  },
  {
    name: '平乡',
    aliases: [
      '平乡'
    ],
    lng: 115.03
  },
  {
    name: '平阳',
    aliases: [
      '平阳'
    ],
    lng: 120.56
  },
  {
    name: '平遥',
    aliases: [
      '平遥'
    ],
    lng: 112.17
  },
  {
    name: '平邑',
    aliases: [
      '平邑'
    ],
    lng: 117.63
  },
  {
    name: '平阴',
    aliases: [
      '平阴'
    ],
    lng: 116.46
  },
  {
    name: '平舆',
    aliases: [
      '平舆'
    ],
    lng: 114.64
  },
  {
    name: '平原',
    aliases: [
      '平原'
    ],
    lng: 116.43
  },
  {
    name: '平远',
    aliases: [
      '平远'
    ],
    lng: 115.89
  },
  {
    name: '凭祥',
    aliases: [
      '凭祥'
    ],
    lng: 106.76
  },
  {
    name: '屏边',
    aliases: [
      '屏边'
    ],
    lng: 103.69
  },
  {
    name: '屏东',
    aliases: [
      '屏东'
    ],
    lng: 120.49
  },
  {
    name: '屏南',
    aliases: [
      '屏南'
    ],
    lng: 118.99
  },
  {
    name: '屏山',
    aliases: [
      '屏山'
    ],
    lng: 104.16
  },
  {
    name: '萍乡',
    aliases: [
      '萍乡'
    ],
    lng: 113.85
  },
  {
    name: '坡头',
    aliases: [
      '坡头'
    ],
    lng: 110.46
  },
  {
    name: '泊头',
    aliases: [
      '泊头'
    ],
    lng: 116.57
  },
  {
    name: '鄱阳',
    aliases: [
      '鄱阳'
    ],
    lng: 116.67
  },
  {
    name: '莆田',
    aliases: [
      '莆田'
    ],
    lng: 119.01
  },
  {
    name: '蒲城',
    aliases: [
      '蒲城'
    ],
    lng: 109.59
  },
  {
    name: '蒲江',
    aliases: [
      '蒲江'
    ],
    lng: 103.51
  },
  {
    name: '蒲县',
    aliases: [
      '蒲县'
    ],
    lng: 111.1
  },
  {
    name: '濮阳',
    aliases: [
      '濮阳'
    ],
    lng: 115.04
  },
  {
    name: '浦北',
    aliases: [
      '浦北'
    ],
    lng: 109.56
  },
  {
    name: '浦城',
    aliases: [
      '浦城'
    ],
    lng: 118.54
  },
  {
    name: '浦东新区',
    aliases: [
      '浦东新区'
    ],
    lng: 121.57
  },
  {
    name: '浦江',
    aliases: [
      '浦江'
    ],
    lng: 119.89
  },
  {
    name: '浦口',
    aliases: [
      '浦口'
    ],
    lng: 118.63
  },
  {
    name: '普安',
    aliases: [
      '普安'
    ],
    lng: 104.96
  },
  {
    name: '普定',
    aliases: [
      '普定'
    ],
    lng: 105.75
  },
  {
    name: '普洱',
    aliases: [
      '普洱'
    ],
    lng: 100.97
  },
  {
    name: '普格',
    aliases: [
      '普格'
    ],
    lng: 102.54
  },
  {
    name: '普兰',
    aliases: [
      '普兰'
    ],
    lng: 81.18
  },
  {
    name: '普兰店',
    aliases: [
      '普兰店'
    ],
    lng: 121.97
  },
  {
    name: '普宁',
    aliases: [
      '普宁'
    ],
    lng: 116.17
  },
  {
    name: '七里河',
    aliases: [
      '七里河'
    ],
    lng: 103.78
  },
  {
    name: '七台河',
    aliases: [
      '七台河'
    ],
    lng: 131.02
  },
  {
    name: '七星',
    aliases: [
      '七星'
    ],
    lng: 110.32
  },
  {
    name: '七星关',
    aliases: [
      '七星关'
    ],
    lng: 105.28
  },
  {
    name: '祁东',
    aliases: [
      '祁东'
    ],
    lng: 112.11
  },
  {
    name: '祁连',
    aliases: [
      '祁连'
    ],
    lng: 100.25
  },
  {
    name: '祁门',
    aliases: [
      '祁门'
    ],
    lng: 117.72
  },
  {
    name: '祁县',
    aliases: [
      '祁县'
    ],
    lng: 112.33
  },
  {
    name: '祁阳',
    aliases: [
      '祁阳'
    ],
    lng: 111.86
  },
  {
    name: '齐河',
    aliases: [
      '齐河'
    ],
    lng: 116.76
  },
  {
    name: '齐齐哈尔',
    aliases: [
      '齐齐哈尔'
    ],
    lng: 123.96
  },
  {
    name: '岐山',
    aliases: [
      '岐山'
    ],
    lng: 107.62
  },
  {
    name: '奇台',
    aliases: [
      '奇台'
    ],
    lng: 89.59
  },
  {
    name: '淇滨',
    aliases: [
      '淇滨'
    ],
    lng: 114.29
  },
  {
    name: '淇县',
    aliases: [
      '淇县'
    ],
    lng: 114.2
  },
  {
    name: '綦江',
    aliases: [
      '綦江'
    ],
    lng: 106.65
  },
  {
    name: '蕲春',
    aliases: [
      '蕲春'
    ],
    lng: 115.43
  },
  {
    name: '麒麟',
    aliases: [
      '麒麟'
    ],
    lng: 103.8
  },
  {
    name: '启东',
    aliases: [
      '启东'
    ],
    lng: 121.66
  },
  {
    name: '杞县',
    aliases: [
      '杞县'
    ],
    lng: 114.77
  },
  {
    name: '千山',
    aliases: [
      '千山'
    ],
    lng: 122.95
  },
  {
    name: '千阳',
    aliases: [
      '千阳'
    ],
    lng: 107.13
  },
  {
    name: '迁安',
    aliases: [
      '迁安'
    ],
    lng: 118.7
  },
  {
    name: '迁西',
    aliases: [
      '迁西'
    ],
    lng: 118.31
  },
  {
    name: '铅山',
    aliases: [
      '铅山'
    ],
    lng: 117.71
  },
  {
    name: '前锋',
    aliases: [
      '前锋'
    ],
    lng: 106.89
  },
  {
    name: '前郭',
    aliases: [
      '前郭'
    ],
    lng: 124.83
  },
  {
    name: '前进',
    aliases: [
      '前进'
    ],
    lng: 130.38
  },
  {
    name: '乾安',
    aliases: [
      '乾安'
    ],
    lng: 124.02
  },
  {
    name: '乾县',
    aliases: [
      '乾县'
    ],
    lng: 108.25
  },
  {
    name: '潜江',
    aliases: [
      '潜江'
    ],
    lng: 112.9
  },
  {
    name: '潜山',
    aliases: [
      '潜山'
    ],
    lng: 116.57
  },
  {
    name: '黔东南',
    aliases: [
      '黔东南'
    ],
    lng: 107.98
  },
  {
    name: '黔江',
    aliases: [
      '黔江'
    ],
    lng: 108.78
  },
  {
    name: '黔南',
    aliases: [
      '黔南'
    ],
    lng: 107.52
  },
  {
    name: '黔西',
    aliases: [
      '黔西'
    ],
    lng: 106.04
  },
  {
    name: '黔西南',
    aliases: [
      '黔西南'
    ],
    lng: 104.9
  },
  {
    name: '桥东',
    aliases: [
      '桥东'
    ],
    lng: 114.7
  },
  {
    name: '桥西',
    aliases: [
      '桥西'
    ],
    lng: 114.61
  },
  {
    name: '硚口',
    aliases: [
      '硚口'
    ],
    lng: 114.26
  },
  {
    name: '谯城',
    aliases: [
      '谯城'
    ],
    lng: 115.78
  },
  {
    name: '巧家',
    aliases: [
      '巧家'
    ],
    lng: 102.93
  },
  {
    name: '且末',
    aliases: [
      '且末'
    ],
    lng: 85.53
  },
  {
    name: '钦北',
    aliases: [
      '钦北'
    ],
    lng: 108.45
  },
  {
    name: '钦南',
    aliases: [
      '钦南'
    ],
    lng: 108.63
  },
  {
    name: '钦州',
    aliases: [
      '钦州'
    ],
    lng: 108.62
  },
  {
    name: '秦安',
    aliases: [
      '秦安'
    ],
    lng: 105.67
  },
  {
    name: '秦都',
    aliases: [
      '秦都'
    ],
    lng: 108.7
  },
  {
    name: '秦淮',
    aliases: [
      '秦淮'
    ],
    lng: 118.79
  },
  {
    name: '秦皇岛',
    aliases: [
      '秦皇岛'
    ],
    lng: 119.59
  },
  {
    name: '秦州',
    aliases: [
      '秦州'
    ],
    lng: 105.72
  },
  {
    name: '沁水',
    aliases: [
      '沁水'
    ],
    lng: 112.19
  },
  {
    name: '沁县',
    aliases: [
      '沁县'
    ],
    lng: 112.7
  },
  {
    name: '沁阳',
    aliases: [
      '沁阳'
    ],
    lng: 112.93
  },
  {
    name: '沁源',
    aliases: [
      '沁源'
    ],
    lng: 112.34
  },
  {
    name: '青白江',
    aliases: [
      '青白江'
    ],
    lng: 104.25
  },
  {
    name: '青川',
    aliases: [
      '青川'
    ],
    lng: 105.24
  },
  {
    name: '青岛',
    aliases: [
      '青岛'
    ],
    lng: 120.36
  },
  {
    name: '青冈',
    aliases: [
      '青冈'
    ],
    lng: 126.11
  },
  {
    name: '青河',
    aliases: [
      '青河'
    ],
    lng: 90.38
  },
  {
    name: '青龙',
    aliases: [
      '青龙'
    ],
    lng: 118.95
  },
  {
    name: '青浦',
    aliases: [
      '青浦'
    ],
    lng: 121.11
  },
  {
    name: '青山湖',
    aliases: [
      '青山湖'
    ],
    lng: 115.95
  },
  {
    name: '青神',
    aliases: [
      '青神'
    ],
    lng: 103.85
  },
  {
    name: '青田',
    aliases: [
      '青田'
    ],
    lng: 120.29
  },
  {
    name: '青铜峡',
    aliases: [
      '青铜峡'
    ],
    lng: 106.08
  },
  {
    name: '青县',
    aliases: [
      '青县'
    ],
    lng: 116.84
  },
  {
    name: '青秀',
    aliases: [
      '青秀'
    ],
    lng: 108.35
  },
  {
    name: '青羊',
    aliases: [
      '青羊'
    ],
    lng: 104.06
  },
  {
    name: '青阳',
    aliases: [
      '青阳'
    ],
    lng: 117.86
  },
  {
    name: '青原',
    aliases: [
      '青原'
    ],
    lng: 115.02
  },
  {
    name: '青云谱',
    aliases: [
      '青云谱'
    ],
    lng: 115.91
  },
  {
    name: '青州',
    aliases: [
      '青州'
    ],
    lng: 118.48
  },
  {
    name: '清城',
    aliases: [
      '清城'
    ],
    lng: 113.05
  },
  {
    name: '清丰',
    aliases: [
      '清丰'
    ],
    lng: 115.11
  },
  {
    name: '清河门',
    aliases: [
      '清河门'
    ],
    lng: 121.42
  },
  {
    name: '清涧',
    aliases: [
      '清涧'
    ],
    lng: 110.12
  },
  {
    name: '清流',
    aliases: [
      '清流'
    ],
    lng: 116.82
  },
  {
    name: '清浦',
    aliases: [
      '清浦'
    ],
    lng: 119
  },
  {
    name: '清水',
    aliases: [
      '清水'
    ],
    lng: 106.14
  },
  {
    name: '清水河',
    aliases: [
      '清水河'
    ],
    lng: 111.67
  },
  {
    name: '清新',
    aliases: [
      '清新'
    ],
    lng: 113.02
  },
  {
    name: '清徐',
    aliases: [
      '清徐'
    ],
    lng: 112.36
  },
  {
    name: '清原',
    aliases: [
      '清原'
    ],
    lng: 124.93
  },
  {
    name: '清远',
    aliases: [
      '清远'
    ],
    lng: 113.05
  },
  {
    name: '清苑',
    aliases: [
      '清苑'
    ],
    lng: 115.49
  },
  {
    name: '清镇',
    aliases: [
      '清镇'
    ],
    lng: 106.47
  },
  {
    name: '晴隆',
    aliases: [
      '晴隆'
    ],
    lng: 105.22
  },
  {
    name: '庆安',
    aliases: [
      '庆安'
    ],
    lng: 127.51
  },
  {
    name: '庆城',
    aliases: [
      '庆城'
    ],
    lng: 107.89
  },
  {
    name: '庆阳',
    aliases: [
      '庆阳'
    ],
    lng: 107.64
  },
  {
    name: '庆元',
    aliases: [
      '庆元'
    ],
    lng: 119.07
  },
  {
    name: '庆云',
    aliases: [
      '庆云'
    ],
    lng: 117.39
  },
  {
    name: '邛崃',
    aliases: [
      '邛崃'
    ],
    lng: 103.46
  },
  {
    name: '琼海',
    aliases: [
      '琼海'
    ],
    lng: 110.47
  },
  {
    name: '琼结',
    aliases: [
      '琼结'
    ],
    lng: 91.68
  },
  {
    name: '琼山',
    aliases: [
      '琼山'
    ],
    lng: 110.35
  },
  {
    name: '琼中',
    aliases: [
      '琼中'
    ],
    lng: 109.84
  },
  {
    name: '丘北',
    aliases: [
      '丘北'
    ],
    lng: 104.19
  },
  {
    name: '邱县',
    aliases: [
      '邱县'
    ],
    lng: 115.17
  },
  {
    name: '曲阜',
    aliases: [
      '曲阜'
    ],
    lng: 116.99
  },
  {
    name: '曲江',
    aliases: [
      '曲江'
    ],
    lng: 113.61
  },
  {
    name: '曲靖',
    aliases: [
      '曲靖'
    ],
    lng: 103.8
  },
  {
    name: '曲麻莱',
    aliases: [
      '曲麻莱'
    ],
    lng: 95.8
  },
  {
    name: '曲水',
    aliases: [
      '曲水'
    ],
    lng: 90.74
  },
  {
    name: '曲松',
    aliases: [
      '曲松'
    ],
    lng: 92.2
  },
  {
    name: '曲沃',
    aliases: [
      '曲沃'
    ],
    lng: 111.48
  },
  {
    name: '曲阳',
    aliases: [
      '曲阳'
    ],
    lng: 114.7
  },
  {
    name: '曲周',
    aliases: [
      '曲周'
    ],
    lng: 114.96
  },
  {
    name: '渠县',
    aliases: [
      '渠县'
    ],
    lng: 106.97
  },
  {
    name: '衢江',
    aliases: [
      '衢江'
    ],
    lng: 118.96
  },
  {
    name: '衢州',
    aliases: [
      '衢州'
    ],
    lng: 118.87
  },
  {
    name: '全椒',
    aliases: [
      '全椒'
    ],
    lng: 118.27
  },
  {
    name: '全南',
    aliases: [
      '全南'
    ],
    lng: 114.53
  },
  {
    name: '全州',
    aliases: [
      '全州'
    ],
    lng: 111.07
  },
  {
    name: '泉港',
    aliases: [
      '泉港'
    ],
    lng: 118.91
  },
  {
    name: '泉山',
    aliases: [
      '泉山'
    ],
    lng: 117.18
  },
  {
    name: '泉州',
    aliases: [
      '泉州'
    ],
    lng: 118.59
  },
  {
    name: '确山',
    aliases: [
      '确山'
    ],
    lng: 114.03
  },
  {
    name: '壤塘',
    aliases: [
      '壤塘'
    ],
    lng: 100.98
  },
  {
    name: '让胡路',
    aliases: [
      '让胡路'
    ],
    lng: 124.87
  },
  {
    name: '饶河',
    aliases: [
      '饶河'
    ],
    lng: 134.02
  },
  {
    name: '饶平',
    aliases: [
      '饶平'
    ],
    lng: 117
  },
  {
    name: '饶阳',
    aliases: [
      '饶阳'
    ],
    lng: 115.73
  },
  {
    name: '仁布',
    aliases: [
      '仁布'
    ],
    lng: 89.84
  },
  {
    name: '仁和',
    aliases: [
      '仁和'
    ],
    lng: 101.74
  },
  {
    name: '仁化',
    aliases: [
      '仁化'
    ],
    lng: 113.75
  },
  {
    name: '仁怀',
    aliases: [
      '仁怀'
    ],
    lng: 106.41
  },
  {
    name: '仁寿',
    aliases: [
      '仁寿'
    ],
    lng: 104.15
  },
  {
    name: '任城',
    aliases: [
      '任城'
    ],
    lng: 116.6
  },
  {
    name: '任丘',
    aliases: [
      '任丘'
    ],
    lng: 116.11
  },
  {
    name: '任县',
    aliases: [
      '任县'
    ],
    lng: 114.68
  },
  {
    name: '日喀则',
    aliases: [
      '日喀则'
    ],
    lng: 88.89
  },
  {
    name: '日土',
    aliases: [
      '日土'
    ],
    lng: 79.73
  },
  {
    name: '日照',
    aliases: [
      '日照'
    ],
    lng: 119.46
  },
  {
    name: '荣昌',
    aliases: [
      '荣昌'
    ],
    lng: 105.59
  },
  {
    name: '荣成',
    aliases: [
      '荣成'
    ],
    lng: 122.42
  },
  {
    name: '荣县',
    aliases: [
      '荣县'
    ],
    lng: 104.42
  },
  {
    name: '容城',
    aliases: [
      '容城'
    ],
    lng: 115.87
  },
  {
    name: '容县',
    aliases: [
      '容县'
    ],
    lng: 110.55
  },
  {
    name: '榕城',
    aliases: [
      '榕城'
    ],
    lng: 116.36
  },
  {
    name: '榕江',
    aliases: [
      '榕江'
    ],
    lng: 108.52
  },
  {
    name: '融安',
    aliases: [
      '融安'
    ],
    lng: 109.4
  },
  {
    name: '融水',
    aliases: [
      '融水'
    ],
    lng: 109.25
  },
  {
    name: '如东',
    aliases: [
      '如东'
    ],
    lng: 121.19
  },
  {
    name: '如皋',
    aliases: [
      '如皋'
    ],
    lng: 120.57
  },
  {
    name: '汝城',
    aliases: [
      '汝城'
    ],
    lng: 113.69
  },
  {
    name: '汝南',
    aliases: [
      '汝南'
    ],
    lng: 114.36
  },
  {
    name: '汝阳',
    aliases: [
      '汝阳'
    ],
    lng: 112.47
  },
  {
    name: '汝州',
    aliases: [
      '汝州'
    ],
    lng: 112.85
  },
  {
    name: '乳山',
    aliases: [
      '乳山'
    ],
    lng: 121.54
  },
  {
    name: '乳源',
    aliases: [
      '乳源'
    ],
    lng: 113.28
  },
  {
    name: '芮城',
    aliases: [
      '芮城'
    ],
    lng: 110.69
  },
  {
    name: '瑞安',
    aliases: [
      '瑞安'
    ],
    lng: 120.65
  },
  {
    name: '瑞昌',
    aliases: [
      '瑞昌'
    ],
    lng: 115.67
  },
  {
    name: '瑞金',
    aliases: [
      '瑞金'
    ],
    lng: 116.03
  },
  {
    name: '瑞丽',
    aliases: [
      '瑞丽'
    ],
    lng: 97.86
  },
  {
    name: '润州',
    aliases: [
      '润州'
    ],
    lng: 119.41
  },
  {
    name: '若尔盖',
    aliases: [
      '若尔盖'
    ],
    lng: 102.96
  },
  {
    name: '若羌',
    aliases: [
      '若羌'
    ],
    lng: 88.17
  },
  {
    name: '萨尔图',
    aliases: [
      '萨尔图'
    ],
    lng: 125.11
  },
  {
    name: '萨嘎',
    aliases: [
      '萨嘎'
    ],
    lng: 85.23
  },
  {
    name: '萨迦',
    aliases: [
      '萨迦'
    ],
    lng: 88.02
  },
  {
    name: '赛罕',
    aliases: [
      '赛罕'
    ],
    lng: 111.7
  },
  {
    name: '三都',
    aliases: [
      '三都'
    ],
    lng: 107.88
  },
  {
    name: '三河',
    aliases: [
      '三河'
    ],
    lng: 117.08
  },
  {
    name: '三江',
    aliases: [
      '三江'
    ],
    lng: 109.61
  },
  {
    name: '三门',
    aliases: [
      '三门'
    ],
    lng: 121.38
  },
  {
    name: '三门峡',
    aliases: [
      '三门峡'
    ],
    lng: 111.19
  },
  {
    name: '三明',
    aliases: [
      '三明'
    ],
    lng: 117.64
  },
  {
    name: '三沙',
    aliases: [
      '三沙'
    ],
    lng: 112.35
  },
  {
    name: '三山',
    aliases: [
      '三山'
    ],
    lng: 118.23
  },
  {
    name: '三水',
    aliases: [
      '三水'
    ],
    lng: 112.9
  },
  {
    name: '三穗',
    aliases: [
      '三穗'
    ],
    lng: 108.68
  },
  {
    name: '三台',
    aliases: [
      '三台'
    ],
    lng: 105.09
  },
  {
    name: '三亚',
    aliases: [
      '三亚'
    ],
    lng: 109.51
  },
  {
    name: '三元',
    aliases: [
      '三元'
    ],
    lng: 117.61
  },
  {
    name: '三原',
    aliases: [
      '三原'
    ],
    lng: 108.94
  },
  {
    name: '桑日',
    aliases: [
      '桑日'
    ],
    lng: 92.02
  },
  {
    name: '桑植',
    aliases: [
      '桑植'
    ],
    lng: 110.16
  },
  {
    name: '桑珠孜',
    aliases: [
      '桑珠孜'
    ],
    lng: 88.89
  },
  {
    name: '色达',
    aliases: [
      '色达'
    ],
    lng: 100.33
  },
  {
    name: '沙河',
    aliases: [
      '沙河'
    ],
    lng: 114.5
  },
  {
    name: '沙河口',
    aliases: [
      '沙河口'
    ],
    lng: 121.59
  },
  {
    name: '沙坪坝',
    aliases: [
      '沙坪坝'
    ],
    lng: 106.45
  },
  {
    name: '沙坡头',
    aliases: [
      '沙坡头'
    ],
    lng: 105.19
  },
  {
    name: '沙市',
    aliases: [
      '沙市'
    ],
    lng: 112.26
  },
  {
    name: '沙县',
    aliases: [
      '沙县'
    ],
    lng: 117.79
  },
  {
    name: '沙雅',
    aliases: [
      '沙雅'
    ],
    lng: 82.78
  },
  {
    name: '沙洋',
    aliases: [
      '沙洋'
    ],
    lng: 112.6
  },
  {
    name: '沙依巴克',
    aliases: [
      '沙依巴克'
    ],
    lng: 87.6
  },
  {
    name: '莎车',
    aliases: [
      '莎车'
    ],
    lng: 77.25
  },
  {
    name: '厦门',
    aliases: [
      '厦门'
    ],
    lng: 118.11
  },
  {
    name: '山城',
    aliases: [
      '山城'
    ],
    lng: 114.18
  },
  {
    name: '山丹',
    aliases: [
      '山丹'
    ],
    lng: 101.09
  },
  {
    name: '山海关',
    aliases: [
      '山海关'
    ],
    lng: 119.75
  },
  {
    name: '山南',
    aliases: [
      '山南'
    ],
    lng: 91.77
  },
  {
    name: '山亭',
    aliases: [
      '山亭'
    ],
    lng: 117.46
  },
  {
    name: '山阴',
    aliases: [
      '山阴'
    ],
    lng: 112.82
  },
  {
    name: '陕县',
    aliases: [
      '陕县'
    ],
    lng: 111.2
  },
  {
    name: '陕州',
    aliases: [
      '陕州'
    ],
    lng: 111.1
  },
  {
    name: '汕头',
    aliases: [
      '汕头'
    ],
    lng: 116.71
  },
  {
    name: '汕尾',
    aliases: [
      '汕尾'
    ],
    lng: 115.36
  },
  {
    name: '鄯善',
    aliases: [
      '鄯善'
    ],
    lng: 90.21
  },
  {
    name: '商城',
    aliases: [
      '商城'
    ],
    lng: 115.41
  },
  {
    name: '商都',
    aliases: [
      '商都'
    ],
    lng: 113.56
  },
  {
    name: '商河',
    aliases: [
      '商河'
    ],
    lng: 117.16
  },
  {
    name: '商洛',
    aliases: [
      '商洛'
    ],
    lng: 109.94
  },
  {
    name: '商南',
    aliases: [
      '商南'
    ],
    lng: 110.89
  },
  {
    name: '商丘',
    aliases: [
      '商丘'
    ],
    lng: 115.65
  },
  {
    name: '商水',
    aliases: [
      '商水'
    ],
    lng: 114.61
  },
  {
    name: '商州',
    aliases: [
      '商州'
    ],
    lng: 109.94
  },
  {
    name: '上蔡',
    aliases: [
      '上蔡'
    ],
    lng: 114.27
  },
  {
    name: '上城',
    aliases: [
      '上城'
    ],
    lng: 120.17
  },
  {
    name: '上甘岭',
    aliases: [
      '上甘岭'
    ],
    lng: 129.03
  },
  {
    name: '上高',
    aliases: [
      '上高'
    ],
    lng: 114.93
  },
  {
    name: '上海',
    aliases: [
      '上海'
    ],
    lng: 121.47
  },
  {
    name: '上杭',
    aliases: [
      '上杭'
    ],
    lng: 116.42
  },
  {
    name: '上街',
    aliases: [
      '上街'
    ],
    lng: 113.3
  },
  {
    name: '上栗',
    aliases: [
      '上栗'
    ],
    lng: 113.8
  },
  {
    name: '上林',
    aliases: [
      '上林'
    ],
    lng: 108.6
  },
  {
    name: '上饶',
    aliases: [
      '上饶'
    ],
    lng: 117.97
  },
  {
    name: '上饶县',
    aliases: [
      '上饶县'
    ],
    lng: 117.91
  },
  {
    name: '上思',
    aliases: [
      '上思'
    ],
    lng: 107.98
  },
  {
    name: '上犹',
    aliases: [
      '上犹'
    ],
    lng: 114.54
  },
  {
    name: '上虞',
    aliases: [
      '上虞'
    ],
    lng: 120.87
  },
  {
    name: '尚义',
    aliases: [
      '尚义'
    ],
    lng: 113.98
  },
  {
    name: '尚志',
    aliases: [
      '尚志'
    ],
    lng: 127.97
  },
  {
    name: '韶关',
    aliases: [
      '韶关'
    ],
    lng: 113.59
  },
  {
    name: '韶山',
    aliases: [
      '韶山'
    ],
    lng: 112.53
  },
  {
    name: '邵东',
    aliases: [
      '邵东'
    ],
    lng: 111.74
  },
  {
    name: '邵武',
    aliases: [
      '邵武'
    ],
    lng: 117.49
  },
  {
    name: '邵阳',
    aliases: [
      '邵阳'
    ],
    lng: 111.47
  },
  {
    name: '邵阳县',
    aliases: [
      '邵阳县'
    ],
    lng: 111.28
  },
  {
    name: '绍兴',
    aliases: [
      '绍兴'
    ],
    lng: 120.58
  },
  {
    name: '社旗',
    aliases: [
      '社旗'
    ],
    lng: 112.94
  },
  {
    name: '射洪',
    aliases: [
      '射洪'
    ],
    lng: 105.38
  },
  {
    name: '射阳',
    aliases: [
      '射阳'
    ],
    lng: 120.26
  },
  {
    name: '涉县',
    aliases: [
      '涉县'
    ],
    lng: 113.67
  },
  {
    name: '歙县',
    aliases: [
      '歙县'
    ],
    lng: 118.43
  },
  {
    name: '申扎',
    aliases: [
      '申扎'
    ],
    lng: 88.71
  },
  {
    name: '莘县',
    aliases: [
      '莘县'
    ],
    lng: 115.67
  },
  {
    name: '深泽',
    aliases: [
      '深泽'
    ],
    lng: 115.2
  },
  {
    name: '深圳',
    aliases: [
      '深圳'
    ],
    lng: 114.09
  },
  {
    name: '深州',
    aliases: [
      '深州'
    ],
    lng: 115.55
  },
  {
    name: '什邡',
    aliases: [
      '什邡'
    ],
    lng: 104.17
  },
  {
    name: '神池',
    aliases: [
      '神池'
    ],
    lng: 112.2
  },
  {
    name: '神木',
    aliases: [
      '神木'
    ],
    lng: 110.5
  },
  {
    name: '神农架',
    aliases: [
      '神农架'
    ],
    lng: 110.67
  },
  {
    name: '沈阳',
    aliases: [
      '沈阳'
    ],
    lng: 123.43
  },
  {
    name: '沈北新区',
    aliases: [
      '沈北新区'
    ],
    lng: 123.52
  },
  {
    name: '沈河',
    aliases: [
      '沈河'
    ],
    lng: 123.45
  },
  {
    name: '沈丘',
    aliases: [
      '沈丘'
    ],
    lng: 115.08
  },
  {
    name: '嵊泗',
    aliases: [
      '嵊泗'
    ],
    lng: 122.46
  },
  {
    name: '嵊州',
    aliases: [
      '嵊州'
    ],
    lng: 120.83
  },
  {
    name: '师宗',
    aliases: [
      '师宗'
    ],
    lng: 103.99
  },
  {
    name: '施秉',
    aliases: [
      '施秉'
    ],
    lng: 108.13
  },
  {
    name: '施甸',
    aliases: [
      '施甸'
    ],
    lng: 99.18
  },
  {
    name: '浉河',
    aliases: [
      '浉河'
    ],
    lng: 114.08
  },
  {
    name: '十堰',
    aliases: [
      '十堰'
    ],
    lng: 110.79
  },
  {
    name: '石城',
    aliases: [
      '石城'
    ],
    lng: 116.34
  },
  {
    name: '石峰',
    aliases: [
      '石峰'
    ],
    lng: 113.11
  },
  {
    name: '石鼓',
    aliases: [
      '石鼓'
    ],
    lng: 112.61
  },
  {
    name: '石拐',
    aliases: [
      '石拐'
    ],
    lng: 110.27
  },
  {
    name: '石河子',
    aliases: [
      '石河子'
    ],
    lng: 86.04
  },
  {
    name: '石家庄',
    aliases: [
      '石家庄'
    ],
    lng: 114.5
  },
  {
    name: '石景山',
    aliases: [
      '石景山'
    ],
    lng: 116.2
  },
  {
    name: '石林',
    aliases: [
      '石林'
    ],
    lng: 103.27
  },
  {
    name: '石龙',
    aliases: [
      '石龙'
    ],
    lng: 112.89
  },
  {
    name: '石楼',
    aliases: [
      '石楼'
    ],
    lng: 110.84
  },
  {
    name: '石门',
    aliases: [
      '石门'
    ],
    lng: 111.38
  },
  {
    name: '石棉',
    aliases: [
      '石棉'
    ],
    lng: 102.36
  },
  {
    name: '石屏',
    aliases: [
      '石屏'
    ],
    lng: 102.48
  },
  {
    name: '石阡',
    aliases: [
      '石阡'
    ],
    lng: 108.23
  },
  {
    name: '石渠',
    aliases: [
      '石渠'
    ],
    lng: 98.1
  },
  {
    name: '石泉',
    aliases: [
      '石泉'
    ],
    lng: 108.25
  },
  {
    name: '石狮',
    aliases: [
      '石狮'
    ],
    lng: 118.63
  },
  {
    name: '石首',
    aliases: [
      '石首'
    ],
    lng: 112.41
  },
  {
    name: '石台',
    aliases: [
      '石台'
    ],
    lng: 117.48
  },
  {
    name: '石柱',
    aliases: [
      '石柱'
    ],
    lng: 108.11
  },
  {
    name: '石嘴山',
    aliases: [
      '石嘴山'
    ],
    lng: 106.38
  },
  {
    name: '始兴',
    aliases: [
      '始兴'
    ],
    lng: 114.07
  },
  {
    name: '市北',
    aliases: [
      '市北'
    ],
    lng: 120.36
  },
  {
    name: '市南',
    aliases: [
      '市南'
    ],
    lng: 120.4
  },
  {
    name: '寿光',
    aliases: [
      '寿光'
    ],
    lng: 118.74
  },
  {
    name: '寿宁',
    aliases: [
      '寿宁'
    ],
    lng: 119.51
  },
  {
    name: '寿县',
    aliases: [
      '寿县'
    ],
    lng: 116.79
  },
  {
    name: '寿阳',
    aliases: [
      '寿阳'
    ],
    lng: 113.18
  },
  {
    name: '疏附',
    aliases: [
      '疏附'
    ],
    lng: 75.86
  },
  {
    name: '疏勒',
    aliases: [
      '疏勒'
    ],
    lng: 76.05
  },
  {
    name: '舒城',
    aliases: [
      '舒城'
    ],
    lng: 116.94
  },
  {
    name: '舒兰',
    aliases: [
      '舒兰'
    ],
    lng: 126.95
  },
  {
    name: '蜀山',
    aliases: [
      '蜀山'
    ],
    lng: 117.26
  },
  {
    name: '沭阳',
    aliases: [
      '沭阳'
    ],
    lng: 118.78
  },
  {
    name: '双柏',
    aliases: [
      '双柏'
    ],
    lng: 101.64
  },
  {
    name: '双城',
    aliases: [
      '双城'
    ],
    lng: 126.31
  },
  {
    name: '双峰',
    aliases: [
      '双峰'
    ],
    lng: 112.2
  },
  {
    name: '双河',
    aliases: [
      '双河'
    ],
    lng: 82.35
  },
  {
    name: '双湖',
    aliases: [
      '双湖'
    ],
    lng: 88.84
  },
  {
    name: '双江',
    aliases: [
      '双江'
    ],
    lng: 99.82
  },
  {
    name: '双辽',
    aliases: [
      '双辽'
    ],
    lng: 123.51
  },
  {
    name: '双流',
    aliases: [
      '双流'
    ],
    lng: 103.92
  },
  {
    name: '双滦',
    aliases: [
      '双滦'
    ],
    lng: 117.8
  },
  {
    name: '双牌',
    aliases: [
      '双牌'
    ],
    lng: 111.66
  },
  {
    name: '双桥',
    aliases: [
      '双桥'
    ],
    lng: 117.94
  },
  {
    name: '双清',
    aliases: [
      '双清'
    ],
    lng: 111.48
  },
  {
    name: '双塔',
    aliases: [
      '双塔'
    ],
    lng: 120.45
  },
  {
    name: '双台子',
    aliases: [
      '双台子'
    ],
    lng: 122.06
  },
  {
    name: '双鸭山',
    aliases: [
      '双鸭山'
    ],
    lng: 131.16
  },
  {
    name: '双阳',
    aliases: [
      '双阳'
    ],
    lng: 125.66
  },
  {
    name: '水城',
    aliases: [
      '水城'
    ],
    lng: 104.96
  },
  {
    name: '水富',
    aliases: [
      '水富'
    ],
    lng: 104.42
  },
  {
    name: '水磨沟',
    aliases: [
      '水磨沟'
    ],
    lng: 87.61
  },
  {
    name: '顺昌',
    aliases: [
      '顺昌'
    ],
    lng: 117.81
  },
  {
    name: '顺城',
    aliases: [
      '顺城'
    ],
    lng: 123.92
  },
  {
    name: '顺德',
    aliases: [
      '顺德'
    ],
    lng: 113.28
  },
  {
    name: '顺河',
    aliases: [
      '顺河'
    ],
    lng: 114.36
  },
  {
    name: '顺平',
    aliases: [
      '顺平'
    ],
    lng: 115.13
  },
  {
    name: '顺庆',
    aliases: [
      '顺庆'
    ],
    lng: 106.08
  },
  {
    name: '顺义',
    aliases: [
      '顺义'
    ],
    lng: 116.65
  },
  {
    name: '朔城',
    aliases: [
      '朔城'
    ],
    lng: 112.43
  },
  {
    name: '朔州',
    aliases: [
      '朔州'
    ],
    lng: 112.43
  },
  {
    name: '思茅',
    aliases: [
      '思茅'
    ],
    lng: 100.97
  },
  {
    name: '思明',
    aliases: [
      '思明'
    ],
    lng: 118.09
  },
  {
    name: '思南',
    aliases: [
      '思南'
    ],
    lng: 108.26
  },
  {
    name: '四方台',
    aliases: [
      '四方台'
    ],
    lng: 131.33
  },
  {
    name: '四会',
    aliases: [
      '四会'
    ],
    lng: 112.7
  },
  {
    name: '四平',
    aliases: [
      '四平'
    ],
    lng: 124.37
  },
  {
    name: '四子王旗',
    aliases: [
      '四子王旗'
    ],
    lng: 111.7
  },
  {
    name: '泗洪',
    aliases: [
      '泗洪'
    ],
    lng: 118.21
  },
  {
    name: '泗水',
    aliases: [
      '泗水'
    ],
    lng: 117.27
  },
  {
    name: '泗县',
    aliases: [
      '泗县'
    ],
    lng: 117.89
  },
  {
    name: '泗阳',
    aliases: [
      '泗阳'
    ],
    lng: 118.68
  },
  {
    name: '松北',
    aliases: [
      '松北'
    ],
    lng: 126.56
  },
  {
    name: '松江',
    aliases: [
      '松江'
    ],
    lng: 121.22
  },
  {
    name: '松潘',
    aliases: [
      '松潘'
    ],
    lng: 103.6
  },
  {
    name: '松山',
    aliases: [
      '松山'
    ],
    lng: 118.94
  },
  {
    name: '松桃',
    aliases: [
      '松桃'
    ],
    lng: 109.2
  },
  {
    name: '松溪',
    aliases: [
      '松溪'
    ],
    lng: 118.78
  },
  {
    name: '松阳',
    aliases: [
      '松阳'
    ],
    lng: 119.49
  },
  {
    name: '松原',
    aliases: [
      '松原'
    ],
    lng: 124.82
  },
  {
    name: '松滋',
    aliases: [
      '松滋'
    ],
    lng: 111.78
  },
  {
    name: '嵩明',
    aliases: [
      '嵩明'
    ],
    lng: 103.04
  },
  {
    name: '嵩县',
    aliases: [
      '嵩县'
    ],
    lng: 112.09
  },
  {
    name: '苏家屯',
    aliases: [
      '苏家屯'
    ],
    lng: 123.34
  },
  {
    name: '苏仙',
    aliases: [
      '苏仙'
    ],
    lng: 113.04
  },
  {
    name: '苏右旗',
    aliases: [
      '苏右旗'
    ],
    lng: 112.39
  },
  {
    name: '苏州',
    aliases: [
      '苏州'
    ],
    lng: 120.62
  },
  {
    name: '苏左旗',
    aliases: [
      '苏左旗'
    ],
    lng: 113.38
  },
  {
    name: '肃北',
    aliases: [
      '肃北'
    ],
    lng: 94.88
  },
  {
    name: '肃南',
    aliases: [
      '肃南'
    ],
    lng: 99.62
  },
  {
    name: '肃宁',
    aliases: [
      '肃宁'
    ],
    lng: 115.84
  },
  {
    name: '肃州',
    aliases: [
      '肃州'
    ],
    lng: 98.51
  },
  {
    name: '宿城',
    aliases: [
      '宿城'
    ],
    lng: 118.28
  },
  {
    name: '宿迁',
    aliases: [
      '宿迁'
    ],
    lng: 118.28
  },
  {
    name: '宿松',
    aliases: [
      '宿松'
    ],
    lng: 116.12
  },
  {
    name: '宿豫',
    aliases: [
      '宿豫'
    ],
    lng: 118.33
  },
  {
    name: '宿州',
    aliases: [
      '宿州'
    ],
    lng: 116.98
  },
  {
    name: '睢宁',
    aliases: [
      '睢宁'
    ],
    lng: 117.95
  },
  {
    name: '睢县',
    aliases: [
      '睢县'
    ],
    lng: 115.07
  },
  {
    name: '睢阳',
    aliases: [
      '睢阳'
    ],
    lng: 115.65
  },
  {
    name: '濉溪',
    aliases: [
      '濉溪'
    ],
    lng: 116.77
  },
  {
    name: '绥滨',
    aliases: [
      '绥滨'
    ],
    lng: 131.86
  },
  {
    name: '绥德',
    aliases: [
      '绥德'
    ],
    lng: 110.27
  },
  {
    name: '绥芬河',
    aliases: [
      '绥芬河'
    ],
    lng: 131.16
  },
  {
    name: '绥化',
    aliases: [
      '绥化'
    ],
    lng: 126.99
  },
  {
    name: '绥江',
    aliases: [
      '绥江'
    ],
    lng: 103.96
  },
  {
    name: '绥棱',
    aliases: [
      '绥棱'
    ],
    lng: 127.11
  },
  {
    name: '绥宁',
    aliases: [
      '绥宁'
    ],
    lng: 110.16
  },
  {
    name: '绥阳',
    aliases: [
      '绥阳'
    ],
    lng: 107.19
  },
  {
    name: '绥中',
    aliases: [
      '绥中'
    ],
    lng: 120.34
  },
  {
    name: '随县',
    aliases: [
      '随县'
    ],
    lng: 113.3
  },
  {
    name: '随州',
    aliases: [
      '随州'
    ],
    lng: 113.37
  },
  {
    name: '遂昌',
    aliases: [
      '遂昌'
    ],
    lng: 119.28
  },
  {
    name: '遂川',
    aliases: [
      '遂川'
    ],
    lng: 114.52
  },
  {
    name: '遂宁',
    aliases: [
      '遂宁'
    ],
    lng: 105.57
  },
  {
    name: '遂平',
    aliases: [
      '遂平'
    ],
    lng: 114
  },
  {
    name: '遂溪',
    aliases: [
      '遂溪'
    ],
    lng: 110.26
  },
  {
    name: '孙吴',
    aliases: [
      '孙吴'
    ],
    lng: 127.33
  },
  {
    name: '索县',
    aliases: [
      '索县'
    ],
    lng: 93.78
  },
  {
    name: '塔城',
    aliases: [
      '塔城'
    ],
    lng: 82.98
  },
  {
    name: '塔河',
    aliases: [
      '塔河'
    ],
    lng: 124.71
  },
  {
    name: '塔什库尔干',
    aliases: [
      '塔什库尔干'
    ],
    lng: 75.23
  },
  {
    name: '台安',
    aliases: [
      '台安'
    ],
    lng: 122.43
  },
  {
    name: '台北',
    aliases: [
      '台北',
      '臺北'
    ],
    lng: 121.56
  },
  {
    name: '台东',
    aliases: [
      '台东'
    ],
    lng: 121.15
  },
  {
    name: '台儿庄',
    aliases: [
      '台儿庄'
    ],
    lng: 117.73
  },
  {
    name: '台南',
    aliases: [
      '台南'
    ],
    lng: 120.2
  },
  {
    name: '台前',
    aliases: [
      '台前'
    ],
    lng: 115.86
  },
  {
    name: '台山',
    aliases: [
      '台山'
    ],
    lng: 112.79
  },
  {
    name: '台中',
    aliases: [
      '台中'
    ],
    lng: 120.67
  },
  {
    name: '台州',
    aliases: [
      '台州'
    ],
    lng: 121.43
  },
  {
    name: '太白',
    aliases: [
      '太白'
    ],
    lng: 107.32
  },
  {
    name: '太仓',
    aliases: [
      '太仓'
    ],
    lng: 121.11
  },
  {
    name: '太谷',
    aliases: [
      '太谷'
    ],
    lng: 112.55
  },
  {
    name: '太湖',
    aliases: [
      '太湖'
    ],
    lng: 116.31
  },
  {
    name: '太康',
    aliases: [
      '太康'
    ],
    lng: 114.85
  },
  {
    name: '太平',
    aliases: [
      '太平'
    ],
    lng: 121.68
  },
  {
    name: '太仆寺',
    aliases: [
      '太仆寺'
    ],
    lng: 115.29
  },
  {
    name: '太原',
    aliases: [
      '太原'
    ],
    lng: 112.55
  },
  {
    name: '太子河',
    aliases: [
      '太子河'
    ],
    lng: 123.19
  },
  {
    name: '泰安',
    aliases: [
      '泰安'
    ],
    lng: 117.13
  },
  {
    name: '泰和',
    aliases: [
      '泰和'
    ],
    lng: 114.9
  },
  {
    name: '泰来',
    aliases: [
      '泰来'
    ],
    lng: 123.42
  },
  {
    name: '泰宁',
    aliases: [
      '泰宁'
    ],
    lng: 117.18
  },
  {
    name: '泰山',
    aliases: [
      '泰山'
    ],
    lng: 117.13
  },
  {
    name: '泰顺',
    aliases: [
      '泰顺'
    ],
    lng: 119.72
  },
  {
    name: '泰兴',
    aliases: [
      '泰兴'
    ],
    lng: 120.02
  },
  {
    name: '泰州',
    aliases: [
      '泰州'
    ],
    lng: 119.92
  },
  {
    name: '郯城',
    aliases: [
      '郯城'
    ],
    lng: 118.34
  },
  {
    name: '覃塘',
    aliases: [
      '覃塘'
    ],
    lng: 109.42
  },
  {
    name: '汤旺河',
    aliases: [
      '汤旺河'
    ],
    lng: 129.57
  },
  {
    name: '汤阴',
    aliases: [
      '汤阴'
    ],
    lng: 114.36
  },
  {
    name: '汤原',
    aliases: [
      '汤原'
    ],
    lng: 129.9
  },
  {
    name: '唐河',
    aliases: [
      '唐河'
    ],
    lng: 112.84
  },
  {
    name: '唐山',
    aliases: [
      '唐山'
    ],
    lng: 118.18
  },
  {
    name: '唐县',
    aliases: [
      '唐县'
    ],
    lng: 114.98
  },
  {
    name: '洮北',
    aliases: [
      '洮北'
    ],
    lng: 122.84
  },
  {
    name: '洮南',
    aliases: [
      '洮南'
    ],
    lng: 122.78
  },
  {
    name: '桃城',
    aliases: [
      '桃城'
    ],
    lng: 115.69
  },
  {
    name: '桃江',
    aliases: [
      '桃江'
    ],
    lng: 112.14
  },
  {
    name: '桃山',
    aliases: [
      '桃山'
    ],
    lng: 131.02
  },
  {
    name: '桃园',
    aliases: [
      '桃园'
    ],
    lng: 121.31
  },
  {
    name: '桃源',
    aliases: [
      '桃源'
    ],
    lng: 111.48
  },
  {
    name: '特克斯',
    aliases: [
      '特克斯'
    ],
    lng: 81.84
  },
  {
    name: '腾冲',
    aliases: [
      '腾冲'
    ],
    lng: 98.5
  },
  {
    name: '滕州',
    aliases: [
      '滕州'
    ],
    lng: 117.16
  },
  {
    name: '藤县',
    aliases: [
      '藤县'
    ],
    lng: 110.93
  },
  {
    name: '天等',
    aliases: [
      '天等'
    ],
    lng: 107.14
  },
  {
    name: '天峨',
    aliases: [
      '天峨'
    ],
    lng: 107.17
  },
  {
    name: '天河',
    aliases: [
      '天河'
    ],
    lng: 113.34
  },
  {
    name: '天津',
    aliases: [
      '天津'
    ],
    lng: 117.2
  },
  {
    name: '天峻',
    aliases: [
      '天峻'
    ],
    lng: 99.02
  },
  {
    name: '天门',
    aliases: [
      '天门'
    ],
    lng: 113.17
  },
  {
    name: '天宁',
    aliases: [
      '天宁'
    ],
    lng: 119.96
  },
  {
    name: '天桥',
    aliases: [
      '天桥'
    ],
    lng: 117
  },
  {
    name: '天全',
    aliases: [
      '天全'
    ],
    lng: 102.76
  },
  {
    name: '天山',
    aliases: [
      '天山'
    ],
    lng: 87.62
  },
  {
    name: '天水',
    aliases: [
      '天水'
    ],
    lng: 105.72
  },
  {
    name: '天台',
    aliases: [
      '天台'
    ],
    lng: 121.03
  },
  {
    name: '天心',
    aliases: [
      '天心'
    ],
    lng: 112.97
  },
  {
    name: '天涯',
    aliases: [
      '天涯'
    ],
    lng: 109.51
  },
  {
    name: '天元',
    aliases: [
      '天元'
    ],
    lng: 113.14
  },
  {
    name: '天长',
    aliases: [
      '天长'
    ],
    lng: 119.01
  },
  {
    name: '天镇',
    aliases: [
      '天镇'
    ],
    lng: 114.09
  },
  {
    name: '天柱',
    aliases: [
      '天柱'
    ],
    lng: 109.21
  },
  {
    name: '天祝',
    aliases: [
      '天祝'
    ],
    lng: 103.14
  },
  {
    name: '田东',
    aliases: [
      '田东'
    ],
    lng: 107.12
  },
  {
    name: '田家庵',
    aliases: [
      '田家庵'
    ],
    lng: 117.02
  },
  {
    name: '田林',
    aliases: [
      '田林'
    ],
    lng: 106.24
  },
  {
    name: '田阳',
    aliases: [
      '田阳'
    ],
    lng: 106.9
  },
  {
    name: '铁锋',
    aliases: [
      '铁锋'
    ],
    lng: 123.97
  },
  {
    name: '铁力',
    aliases: [
      '铁力'
    ],
    lng: 128.03
  },
  {
    name: '铁岭',
    aliases: [
      '铁岭'
    ],
    lng: 123.73
  },
  {
    name: '铁门关',
    aliases: [
      '铁门关'
    ],
    lng: 85.5
  },
  {
    name: '铁山',
    aliases: [
      '铁山'
    ],
    lng: 114.9
  },
  {
    name: '铁山港',
    aliases: [
      '铁山港'
    ],
    lng: 109.45
  },
  {
    name: '亭湖',
    aliases: [
      '亭湖'
    ],
    lng: 120.14
  },
  {
    name: '通城',
    aliases: [
      '通城'
    ],
    lng: 113.81
  },
  {
    name: '通川',
    aliases: [
      '通川'
    ],
    lng: 107.5
  },
  {
    name: '通道',
    aliases: [
      '通道'
    ],
    lng: 109.78
  },
  {
    name: '通海',
    aliases: [
      '通海'
    ],
    lng: 102.76
  },
  {
    name: '通河',
    aliases: [
      '通河'
    ],
    lng: 128.75
  },
  {
    name: '通化',
    aliases: [
      '通化'
    ],
    lng: 125.94
  },
  {
    name: '通化县',
    aliases: [
      '通化县'
    ],
    lng: 125.75
  },
  {
    name: '通江',
    aliases: [
      '通江'
    ],
    lng: 107.25
  },
  {
    name: '通辽',
    aliases: [
      '通辽'
    ],
    lng: 122.26
  },
  {
    name: '通山',
    aliases: [
      '通山'
    ],
    lng: 114.49
  },
  {
    name: '通渭',
    aliases: [
      '通渭'
    ],
    lng: 105.25
  },
  {
    name: '通许',
    aliases: [
      '通许'
    ],
    lng: 114.47
  },
  {
    name: '通榆',
    aliases: [
      '通榆'
    ],
    lng: 123.09
  },
  {
    name: '同安',
    aliases: [
      '同安'
    ],
    lng: 118.15
  },
  {
    name: '同德',
    aliases: [
      '同德'
    ],
    lng: 100.58
  },
  {
    name: '同江',
    aliases: [
      '同江'
    ],
    lng: 132.51
  },
  {
    name: '同仁',
    aliases: [
      '同仁'
    ],
    lng: 102.02
  },
  {
    name: '同心',
    aliases: [
      '同心'
    ],
    lng: 105.91
  },
  {
    name: '桐柏',
    aliases: [
      '桐柏'
    ],
    lng: 113.41
  },
  {
    name: '桐城',
    aliases: [
      '桐城'
    ],
    lng: 116.96
  },
  {
    name: '桐庐',
    aliases: [
      '桐庐'
    ],
    lng: 119.69
  },
  {
    name: '桐乡',
    aliases: [
      '桐乡'
    ],
    lng: 120.55
  },
  {
    name: '桐梓',
    aliases: [
      '桐梓'
    ],
    lng: 106.83
  },
  {
    name: '铜川',
    aliases: [
      '铜川'
    ],
    lng: 108.98
  },
  {
    name: '铜鼓',
    aliases: [
      '铜鼓'
    ],
    lng: 114.37
  },
  {
    name: '铜官',
    aliases: [
      '铜官'
    ],
    lng: 117.82
  },
  {
    name: '铜梁',
    aliases: [
      '铜梁'
    ],
    lng: 106.05
  },
  {
    name: '铜陵',
    aliases: [
      '铜陵'
    ],
    lng: 117.82
  },
  {
    name: '铜仁',
    aliases: [
      '铜仁'
    ],
    lng: 109.19
  },
  {
    name: '铜山',
    aliases: [
      '铜山'
    ],
    lng: 117.18
  },
  {
    name: '潼关',
    aliases: [
      '潼关'
    ],
    lng: 110.25
  },
  {
    name: '潼南',
    aliases: [
      '潼南'
    ],
    lng: 105.84
  },
  {
    name: '头屯河',
    aliases: [
      '头屯河'
    ],
    lng: 87.43
  },
  {
    name: '突泉',
    aliases: [
      '突泉'
    ],
    lng: 121.56
  },
  {
    name: '图们',
    aliases: [
      '图们'
    ],
    lng: 129.85
  },
  {
    name: '图木舒克',
    aliases: [
      '图木舒克'
    ],
    lng: 79.08
  },
  {
    name: '土右旗',
    aliases: [
      '土右旗'
    ],
    lng: 110.32
  },
  {
    name: '土左旗',
    aliases: [
      '土左旗'
    ],
    lng: 111.09
  },
  {
    name: '吐鲁番',
    aliases: [
      '吐鲁番'
    ],
    lng: 89.18
  },
  {
    name: '团风',
    aliases: [
      '团风'
    ],
    lng: 114.87
  },
  {
    name: '屯昌',
    aliases: [
      '屯昌'
    ],
    lng: 110.1
  },
  {
    name: '屯留',
    aliases: [
      '屯留'
    ],
    lng: 112.89
  },
  {
    name: '屯溪',
    aliases: [
      '屯溪'
    ],
    lng: 118.32
  },
  {
    name: '托克逊',
    aliases: [
      '托克逊'
    ],
    lng: 88.66
  },
  {
    name: '托里',
    aliases: [
      '托里'
    ],
    lng: 83.6
  },
  {
    name: '托县',
    aliases: [
      '托县'
    ],
    lng: 111.11
  },
  {
    name: '瓦房店',
    aliases: [
      '瓦房店'
    ],
    lng: 122
  },
  {
    name: '湾里',
    aliases: [
      '湾里'
    ],
    lng: 115.73
  },
  {
    name: '宛城',
    aliases: [
      '宛城'
    ],
    lng: 112.54
  },
  {
    name: '万安',
    aliases: [
      '万安'
    ],
    lng: 114.78
  },
  {
    name: '万柏林',
    aliases: [
      '万柏林'
    ],
    lng: 112.52
  },
  {
    name: '万年',
    aliases: [
      '万年'
    ],
    lng: 117.07
  },
  {
    name: '万宁',
    aliases: [
      '万宁'
    ],
    lng: 110.39
  },
  {
    name: '万全',
    aliases: [
      '万全'
    ],
    lng: 114.74
  },
  {
    name: '万荣',
    aliases: [
      '万荣'
    ],
    lng: 110.84
  },
  {
    name: '万山',
    aliases: [
      '万山'
    ],
    lng: 109.21
  },
  {
    name: '万秀',
    aliases: [
      '万秀'
    ],
    lng: 111.32
  },
  {
    name: '万源',
    aliases: [
      '万源'
    ],
    lng: 108.04
  },
  {
    name: '万载',
    aliases: [
      '万载'
    ],
    lng: 114.45
  },
  {
    name: '万州',
    aliases: [
      '万州'
    ],
    lng: 108.38
  },
  {
    name: '汪清',
    aliases: [
      '汪清'
    ],
    lng: 129.77
  },
  {
    name: '王益',
    aliases: [
      '王益'
    ],
    lng: 109.08
  },
  {
    name: '旺苍',
    aliases: [
      '旺苍'
    ],
    lng: 106.29
  },
  {
    name: '望城',
    aliases: [
      '望城'
    ],
    lng: 112.82
  },
  {
    name: '望都',
    aliases: [
      '望都'
    ],
    lng: 115.15
  },
  {
    name: '望花',
    aliases: [
      '望花'
    ],
    lng: 123.8
  },
  {
    name: '望江',
    aliases: [
      '望江'
    ],
    lng: 116.69
  },
  {
    name: '望奎',
    aliases: [
      '望奎'
    ],
    lng: 126.48
  },
  {
    name: '望谟',
    aliases: [
      '望谟'
    ],
    lng: 106.09
  },
  {
    name: '威海',
    aliases: [
      '威海'
    ],
    lng: 122.12
  },
  {
    name: '威宁',
    aliases: [
      '威宁'
    ],
    lng: 104.29
  },
  {
    name: '威县',
    aliases: [
      '威县'
    ],
    lng: 115.27
  },
  {
    name: '威信',
    aliases: [
      '威信'
    ],
    lng: 105.05
  },
  {
    name: '威远',
    aliases: [
      '威远'
    ],
    lng: 104.67
  },
  {
    name: '微山',
    aliases: [
      '微山'
    ],
    lng: 117.13
  },
  {
    name: '巍山',
    aliases: [
      '巍山'
    ],
    lng: 100.31
  },
  {
    name: '围场',
    aliases: [
      '围场'
    ],
    lng: 117.76
  },
  {
    name: '维西',
    aliases: [
      '维西'
    ],
    lng: 99.29
  },
  {
    name: '潍城',
    aliases: [
      '潍城'
    ],
    lng: 119.1
  },
  {
    name: '潍坊',
    aliases: [
      '潍坊'
    ],
    lng: 119.11
  },
  {
    name: '卫滨',
    aliases: [
      '卫滨'
    ],
    lng: 113.87
  },
  {
    name: '卫东',
    aliases: [
      '卫东'
    ],
    lng: 113.31
  },
  {
    name: '卫辉',
    aliases: [
      '卫辉'
    ],
    lng: 114.07
  },
  {
    name: '未央',
    aliases: [
      '未央'
    ],
    lng: 108.95
  },
  {
    name: '尉犁',
    aliases: [
      '尉犁'
    ],
    lng: 86.26
  },
  {
    name: '尉氏',
    aliases: [
      '尉氏'
    ],
    lng: 114.19
  },
  {
    name: '渭滨',
    aliases: [
      '渭滨'
    ],
    lng: 107.14
  },
  {
    name: '渭城',
    aliases: [
      '渭城'
    ],
    lng: 108.73
  },
  {
    name: '渭南',
    aliases: [
      '渭南'
    ],
    lng: 109.5
  },
  {
    name: '渭源',
    aliases: [
      '渭源'
    ],
    lng: 104.21
  },
  {
    name: '蔚县',
    aliases: [
      '蔚县'
    ],
    lng: 114.58
  },
  {
    name: '魏都',
    aliases: [
      '魏都'
    ],
    lng: 113.83
  },
  {
    name: '魏县',
    aliases: [
      '魏县'
    ],
    lng: 114.93
  },
  {
    name: '温江',
    aliases: [
      '温江'
    ],
    lng: 103.84
  },
  {
    name: '温岭',
    aliases: [
      '温岭'
    ],
    lng: 121.37
  },
  {
    name: '温泉',
    aliases: [
      '温泉'
    ],
    lng: 81.03
  },
  {
    name: '温宿',
    aliases: [
      '温宿'
    ],
    lng: 80.24
  },
  {
    name: '温县',
    aliases: [
      '温县'
    ],
    lng: 113.08
  },
  {
    name: '温州',
    aliases: [
      '温州'
    ],
    lng: 120.67
  },
  {
    name: '文安',
    aliases: [
      '文安'
    ],
    lng: 116.46
  },
  {
    name: '文昌',
    aliases: [
      '文昌'
    ],
    lng: 110.75
  },
  {
    name: '文成',
    aliases: [
      '文成'
    ],
    lng: 120.09
  },
  {
    name: '文登',
    aliases: [
      '文登'
    ],
    lng: 122.06
  },
  {
    name: '文峰',
    aliases: [
      '文峰'
    ],
    lng: 114.35
  },
  {
    name: '文山',
    aliases: [
      '文山'
    ],
    lng: 104.24
  },
  {
    name: '文圣',
    aliases: [
      '文圣'
    ],
    lng: 123.19
  },
  {
    name: '文水',
    aliases: [
      '文水'
    ],
    lng: 112.03
  },
  {
    name: '文县',
    aliases: [
      '文县'
    ],
    lng: 104.68
  },
  {
    name: '闻喜',
    aliases: [
      '闻喜'
    ],
    lng: 111.22
  },
  {
    name: '汶川',
    aliases: [
      '汶川'
    ],
    lng: 103.58
  },
  {
    name: '汶上',
    aliases: [
      '汶上'
    ],
    lng: 116.49
  },
  {
    name: '翁牛特',
    aliases: [
      '翁牛特'
    ],
    lng: 119.02
  },
  {
    name: '翁源',
    aliases: [
      '翁源'
    ],
    lng: 114.13
  },
  {
    name: '瓮安',
    aliases: [
      '瓮安'
    ],
    lng: 107.48
  },
  {
    name: '涡阳',
    aliases: [
      '涡阳'
    ],
    lng: 116.21
  },
  {
    name: '卧龙',
    aliases: [
      '卧龙'
    ],
    lng: 112.53
  },
  {
    name: '乌达',
    aliases: [
      '乌达'
    ],
    lng: 106.72
  },
  {
    name: '乌当',
    aliases: [
      '乌当'
    ],
    lng: 106.76
  },
  {
    name: '乌尔禾',
    aliases: [
      '乌尔禾'
    ],
    lng: 85.7
  },
  {
    name: '乌海',
    aliases: [
      '乌海'
    ],
    lng: 106.83
  },
  {
    name: '乌后旗',
    aliases: [
      '乌后旗'
    ],
    lng: 106.59
  },
  {
    name: '乌兰',
    aliases: [
      '乌兰'
    ],
    lng: 98.48
  },
  {
    name: '乌兰察布',
    aliases: [
      '乌兰察布'
    ],
    lng: 113.11
  },
  {
    name: '乌兰浩特',
    aliases: [
      '乌兰浩特'
    ],
    lng: 122.07
  },
  {
    name: '乌鲁木齐',
    aliases: [
      '乌鲁木齐',
      '乌市'
    ],
    lng: 87.62
  },
  {
    name: '乌鲁木齐县',
    aliases: [
      '乌鲁木齐县'
    ],
    lng: 87.51
  },
  {
    name: '乌马河',
    aliases: [
      '乌马河'
    ],
    lng: 128.8
  },
  {
    name: '乌恰',
    aliases: [
      '乌恰'
    ],
    lng: 75.26
  },
  {
    name: '乌前旗',
    aliases: [
      '乌前旗'
    ],
    lng: 108.39
  },
  {
    name: '乌什',
    aliases: [
      '乌什'
    ],
    lng: 79.23
  },
  {
    name: '乌审旗',
    aliases: [
      '乌审旗'
    ],
    lng: 108.84
  },
  {
    name: '乌苏',
    aliases: [
      '乌苏'
    ],
    lng: 84.68
  },
  {
    name: '乌伊岭',
    aliases: [
      '乌伊岭'
    ],
    lng: 129.44
  },
  {
    name: '乌中旗',
    aliases: [
      '乌中旗'
    ],
    lng: 108.31
  },
  {
    name: '巫山',
    aliases: [
      '巫山'
    ],
    lng: 109.88
  },
  {
    name: '巫溪',
    aliases: [
      '巫溪'
    ],
    lng: 109.63
  },
  {
    name: '无棣',
    aliases: [
      '无棣'
    ],
    lng: 117.62
  },
  {
    name: '无极',
    aliases: [
      '无极'
    ],
    lng: 114.98
  },
  {
    name: '无为',
    aliases: [
      '无为'
    ],
    lng: 117.91
  },
  {
    name: '无锡',
    aliases: [
      '无锡'
    ],
    lng: 120.3
  },
  {
    name: '吴堡',
    aliases: [
      '吴堡'
    ],
    lng: 110.74
  },
  {
    name: '吴川',
    aliases: [
      '吴川'
    ],
    lng: 110.78
  },
  {
    name: '吴江',
    aliases: [
      '吴江'
    ],
    lng: 120.64
  },
  {
    name: '吴起',
    aliases: [
      '吴起'
    ],
    lng: 108.18
  },
  {
    name: '吴桥',
    aliases: [
      '吴桥'
    ],
    lng: 116.39
  },
  {
    name: '吴兴',
    aliases: [
      '吴兴'
    ],
    lng: 120.1
  },
  {
    name: '吴中',
    aliases: [
      '吴中'
    ],
    lng: 120.62
  },
  {
    name: '吴忠',
    aliases: [
      '吴忠'
    ],
    lng: 106.2
  },
  {
    name: '芜湖',
    aliases: [
      '芜湖'
    ],
    lng: 118.38
  },
  {
    name: '芜湖县',
    aliases: [
      '芜湖县'
    ],
    lng: 118.57
  },
  {
    name: '梧州',
    aliases: [
      '梧州'
    ],
    lng: 111.3
  },
  {
    name: '五常',
    aliases: [
      '五常'
    ],
    lng: 127.16
  },
  {
    name: '五大连池',
    aliases: [
      '五大连池'
    ],
    lng: 126.2
  },
  {
    name: '五峰',
    aliases: [
      '五峰'
    ],
    lng: 110.67
  },
  {
    name: '五河',
    aliases: [
      '五河'
    ],
    lng: 117.89
  },
  {
    name: '五家渠',
    aliases: [
      '五家渠'
    ],
    lng: 87.53
  },
  {
    name: '五莲',
    aliases: [
      '五莲'
    ],
    lng: 119.21
  },
  {
    name: '五台县',
    aliases: [
      '五台县'
    ],
    lng: 113.26
  },
  {
    name: '五通桥',
    aliases: [
      '五通桥'
    ],
    lng: 103.82
  },
  {
    name: '五营',
    aliases: [
      '五营'
    ],
    lng: 129.25
  },
  {
    name: '五原',
    aliases: [
      '五原'
    ],
    lng: 108.27
  },
  {
    name: '五寨',
    aliases: [
      '五寨'
    ],
    lng: 111.84
  },
  {
    name: '五指山',
    aliases: [
      '五指山'
    ],
    lng: 109.52
  },
  {
    name: '伍家岗',
    aliases: [
      '伍家岗'
    ],
    lng: 111.31
  },
  {
    name: '武安',
    aliases: [
      '武安'
    ],
    lng: 114.19
  },
  {
    name: '武昌',
    aliases: [
      '武昌'
    ],
    lng: 114.31
  },
  {
    name: '武城',
    aliases: [
      '武城'
    ],
    lng: 116.08
  },
  {
    name: '武川',
    aliases: [
      '武川'
    ],
    lng: 111.46
  },
  {
    name: '武定',
    aliases: [
      '武定'
    ],
    lng: 102.41
  },
  {
    name: '武都',
    aliases: [
      '武都'
    ],
    lng: 104.93
  },
  {
    name: '武冈',
    aliases: [
      '武冈'
    ],
    lng: 110.64
  },
  {
    name: '武功',
    aliases: [
      '武功'
    ],
    lng: 108.21
  },
  {
    name: '武汉',
    aliases: [
      '武汉'
    ],
    lng: 114.3
  },
  {
    name: '武侯',
    aliases: [
      '武侯'
    ],
    lng: 104.05
  },
  {
    name: '武江',
    aliases: [
      '武江'
    ],
    lng: 113.59
  },
  {
    name: '武进',
    aliases: [
      '武进'
    ],
    lng: 119.96
  },
  {
    name: '武陵',
    aliases: [
      '武陵'
    ],
    lng: 111.69
  },
  {
    name: '武陵源',
    aliases: [
      '武陵源'
    ],
    lng: 110.55
  },
  {
    name: '武隆',
    aliases: [
      '武隆'
    ],
    lng: 107.76
  },
  {
    name: '武鸣',
    aliases: [
      '武鸣'
    ],
    lng: 108.28
  },
  {
    name: '武宁',
    aliases: [
      '武宁'
    ],
    lng: 115.11
  },
  {
    name: '武平',
    aliases: [
      '武平'
    ],
    lng: 116.1
  },
  {
    name: '武强',
    aliases: [
      '武强'
    ],
    lng: 115.97
  },
  {
    name: '武清',
    aliases: [
      '武清'
    ],
    lng: 117.06
  },
  {
    name: '武山',
    aliases: [
      '武山'
    ],
    lng: 104.89
  },
  {
    name: '武胜',
    aliases: [
      '武胜'
    ],
    lng: 106.29
  },
  {
    name: '武威',
    aliases: [
      '武威'
    ],
    lng: 102.63
  },
  {
    name: '武乡',
    aliases: [
      '武乡'
    ],
    lng: 112.87
  },
  {
    name: '武宣',
    aliases: [
      '武宣'
    ],
    lng: 109.66
  },
  {
    name: '武穴',
    aliases: [
      '武穴'
    ],
    lng: 115.56
  },
  {
    name: '武夷山',
    aliases: [
      '武夷山'
    ],
    lng: 118.03
  },
  {
    name: '武义',
    aliases: [
      '武义'
    ],
    lng: 119.82
  },
  {
    name: '武邑',
    aliases: [
      '武邑'
    ],
    lng: 115.89
  },
  {
    name: '武陟',
    aliases: [
      '武陟'
    ],
    lng: 113.41
  },
  {
    name: '舞钢',
    aliases: [
      '舞钢'
    ],
    lng: 113.53
  },
  {
    name: '舞阳',
    aliases: [
      '舞阳'
    ],
    lng: 113.61
  },
  {
    name: '务川',
    aliases: [
      '务川'
    ],
    lng: 107.89
  },
  {
    name: '婺城',
    aliases: [
      '婺城'
    ],
    lng: 119.65
  },
  {
    name: '婺源',
    aliases: [
      '婺源'
    ],
    lng: 117.86
  },
  {
    name: '西安',
    aliases: [
      '西安',
      '长安'
    ],
    lng: 108.94
  },
  {
    name: '西昌',
    aliases: [
      '西昌'
    ],
    lng: 102.26
  },
  {
    name: '西城',
    aliases: [
      '西城'
    ],
    lng: 116.37
  },
  {
    name: '西充',
    aliases: [
      '西充'
    ],
    lng: 105.89
  },
  {
    name: '西畴',
    aliases: [
      '西畴'
    ],
    lng: 104.68
  },
  {
    name: '西丰',
    aliases: [
      '西丰'
    ],
    lng: 124.72
  },
  {
    name: '西峰',
    aliases: [
      '西峰'
    ],
    lng: 107.64
  },
  {
    name: '西岗',
    aliases: [
      '西岗'
    ],
    lng: 121.62
  },
  {
    name: '西工',
    aliases: [
      '西工'
    ],
    lng: 112.44
  },
  {
    name: '西固',
    aliases: [
      '西固'
    ],
    lng: 103.62
  },
  {
    name: '西和',
    aliases: [
      '西和'
    ],
    lng: 105.3
  },
  {
    name: '西华',
    aliases: [
      '西华'
    ],
    lng: 114.53
  },
  {
    name: '西吉',
    aliases: [
      '西吉'
    ],
    lng: 105.73
  },
  {
    name: '西陵',
    aliases: [
      '西陵'
    ],
    lng: 111.3
  },
  {
    name: '西盟',
    aliases: [
      '西盟'
    ],
    lng: 99.59
  },
  {
    name: '西宁',
    aliases: [
      '西宁'
    ],
    lng: 101.78
  },
  {
    name: '西平',
    aliases: [
      '西平'
    ],
    lng: 114.03
  },
  {
    name: '西青',
    aliases: [
      '西青'
    ],
    lng: 117.01
  },
  {
    name: '西区',
    aliases: [
      '西区'
    ],
    lng: 101.64
  },
  {
    name: '西塞山',
    aliases: [
      '西塞山'
    ],
    lng: 115.09
  },
  {
    name: '西沙',
    aliases: [
      '西沙'
    ],
    lng: 111.79
  },
  {
    name: '西山',
    aliases: [
      '西山'
    ],
    lng: 102.71
  },
  {
    name: '西市',
    aliases: [
      '西市'
    ],
    lng: 122.21
  },
  {
    name: '西双版纳',
    aliases: [
      '西双版纳'
    ],
    lng: 100.8
  },
  {
    name: '西乌旗',
    aliases: [
      '西乌旗'
    ],
    lng: 117.36
  },
  {
    name: '西峡',
    aliases: [
      '西峡'
    ],
    lng: 111.49
  },
  {
    name: '西夏',
    aliases: [
      '西夏'
    ],
    lng: 106.13
  },
  {
    name: '西乡',
    aliases: [
      '西乡'
    ],
    lng: 107.77
  },
  {
    name: '西乡塘',
    aliases: [
      '西乡塘'
    ],
    lng: 108.31
  },
  {
    name: '西秀',
    aliases: [
      '西秀'
    ],
    lng: 105.95
  },
  {
    name: '昔阳',
    aliases: [
      '昔阳'
    ],
    lng: 113.71
  },
  {
    name: '息烽',
    aliases: [
      '息烽'
    ],
    lng: 106.74
  },
  {
    name: '息县',
    aliases: [
      '息县'
    ],
    lng: 114.74
  },
  {
    name: '浠水',
    aliases: [
      '浠水'
    ],
    lng: 115.26
  },
  {
    name: '淅川',
    aliases: [
      '淅川'
    ],
    lng: 111.49
  },
  {
    name: '溪湖',
    aliases: [
      '溪湖'
    ],
    lng: 123.77
  },
  {
    name: '锡林郭勒',
    aliases: [
      '锡林郭勒'
    ],
    lng: 116.09
  },
  {
    name: '锡林浩特',
    aliases: [
      '锡林浩特'
    ],
    lng: 116.09
  },
  {
    name: '锡山',
    aliases: [
      '锡山'
    ],
    lng: 120.36
  },
  {
    name: '习水',
    aliases: [
      '习水'
    ],
    lng: 106.2
  },
  {
    name: '隰县',
    aliases: [
      '隰县'
    ],
    lng: 110.94
  },
  {
    name: '喜德',
    aliases: [
      '喜德'
    ],
    lng: 102.41
  },
  {
    name: '细河',
    aliases: [
      '细河'
    ],
    lng: 121.65
  },
  {
    name: '峡江',
    aliases: [
      '峡江'
    ],
    lng: 115.32
  },
  {
    name: '霞浦',
    aliases: [
      '霞浦'
    ],
    lng: 120.01
  },
  {
    name: '霞山',
    aliases: [
      '霞山'
    ],
    lng: 110.41
  },
  {
    name: '下城',
    aliases: [
      '下城'
    ],
    lng: 120.17
  },
  {
    name: '下花园',
    aliases: [
      '下花园'
    ],
    lng: 115.28
  },
  {
    name: '下陆',
    aliases: [
      '下陆'
    ],
    lng: 114.98
  },
  {
    name: '夏河',
    aliases: [
      '夏河'
    ],
    lng: 102.52
  },
  {
    name: '夏津',
    aliases: [
      '夏津'
    ],
    lng: 116
  },
  {
    name: '夏县',
    aliases: [
      '夏县'
    ],
    lng: 111.22
  },
  {
    name: '夏邑',
    aliases: [
      '夏邑'
    ],
    lng: 116.14
  },
  {
    name: '仙居',
    aliases: [
      '仙居'
    ],
    lng: 120.74
  },
  {
    name: '仙桃',
    aliases: [
      '仙桃'
    ],
    lng: 113.45
  },
  {
    name: '仙游',
    aliases: [
      '仙游'
    ],
    lng: 118.69
  },
  {
    name: '咸安',
    aliases: [
      '咸安'
    ],
    lng: 114.33
  },
  {
    name: '咸丰',
    aliases: [
      '咸丰'
    ],
    lng: 109.15
  },
  {
    name: '咸宁',
    aliases: [
      '咸宁'
    ],
    lng: 114.33
  },
  {
    name: '咸阳',
    aliases: [
      '咸阳'
    ],
    lng: 108.71
  },
  {
    name: '献县',
    aliases: [
      '献县'
    ],
    lng: 116.12
  },
  {
    name: '乡城',
    aliases: [
      '乡城'
    ],
    lng: 99.8
  },
  {
    name: '乡宁',
    aliases: [
      '乡宁'
    ],
    lng: 110.86
  },
  {
    name: '芗城',
    aliases: [
      '芗城'
    ],
    lng: 117.66
  },
  {
    name: '相城',
    aliases: [
      '相城'
    ],
    lng: 120.62
  },
  {
    name: '相山',
    aliases: [
      '相山'
    ],
    lng: 116.79
  },
  {
    name: '香坊',
    aliases: [
      '香坊'
    ],
    lng: 126.67
  },
  {
    name: '香港',
    aliases: [
      '香港',
      'HK',
      'Hong Kong'
    ],
    lng: 114.17
  },
  {
    name: '香格里拉',
    aliases: [
      '香格里拉'
    ],
    lng: 99.71
  },
  {
    name: '香河',
    aliases: [
      '香河'
    ],
    lng: 117.01
  },
  {
    name: '香洲',
    aliases: [
      '香洲'
    ],
    lng: 113.55
  },
  {
    name: '湘东',
    aliases: [
      '湘东'
    ],
    lng: 113.75
  },
  {
    name: '湘江新区',
    aliases: [
      '湘江新区'
    ],
    lng: 113.05
  },
  {
    name: '湘桥',
    aliases: [
      '湘桥'
    ],
    lng: 116.63
  },
  {
    name: '湘潭',
    aliases: [
      '湘潭'
    ],
    lng: 112.94
  },
  {
    name: '湘西',
    aliases: [
      '湘西'
    ],
    lng: 109.74
  },
  {
    name: '湘乡',
    aliases: [
      '湘乡'
    ],
    lng: 112.53
  },
  {
    name: '湘阴',
    aliases: [
      '湘阴'
    ],
    lng: 112.89
  },
  {
    name: '襄汾',
    aliases: [
      '襄汾'
    ],
    lng: 111.44
  },
  {
    name: '襄阳',
    aliases: [
      '襄阳'
    ],
    lng: 112.14
  },
  {
    name: '襄垣',
    aliases: [
      '襄垣'
    ],
    lng: 113.05
  },
  {
    name: '襄州',
    aliases: [
      '襄州'
    ],
    lng: 112.2
  },
  {
    name: '镶黄旗',
    aliases: [
      '镶黄旗'
    ],
    lng: 113.84
  },
  {
    name: '祥符',
    aliases: [
      '祥符'
    ],
    lng: 114.44
  },
  {
    name: '祥云',
    aliases: [
      '祥云'
    ],
    lng: 100.55
  },
  {
    name: '翔安',
    aliases: [
      '翔安'
    ],
    lng: 118.24
  },
  {
    name: '响水',
    aliases: [
      '响水'
    ],
    lng: 119.58
  },
  {
    name: '向阳',
    aliases: [
      '向阳'
    ],
    lng: 130.33
  },
  {
    name: '项城',
    aliases: [
      '项城'
    ],
    lng: 114.9
  },
  {
    name: '象州',
    aliases: [
      '象州'
    ],
    lng: 109.68
  },
  {
    name: '猇亭',
    aliases: [
      '猇亭'
    ],
    lng: 111.43
  },
  {
    name: '萧山',
    aliases: [
      '萧山'
    ],
    lng: 120.27
  },
  {
    name: '萧县',
    aliases: [
      '萧县'
    ],
    lng: 116.95
  },
  {
    name: '小店区',
    aliases: [
      '小店区'
    ],
    lng: 112.56
  },
  {
    name: '小金',
    aliases: [
      '小金'
    ],
    lng: 102.36
  },
  {
    name: '孝昌',
    aliases: [
      '孝昌'
    ],
    lng: 113.99
  },
  {
    name: '孝感',
    aliases: [
      '孝感'
    ],
    lng: 113.93
  },
  {
    name: '孝南',
    aliases: [
      '孝南'
    ],
    lng: 113.93
  },
  {
    name: '孝义',
    aliases: [
      '孝义'
    ],
    lng: 111.78
  },
  {
    name: '谢家集',
    aliases: [
      '谢家集'
    ],
    lng: 116.87
  },
  {
    name: '谢通门',
    aliases: [
      '谢通门'
    ],
    lng: 88.26
  },
  {
    name: '忻城',
    aliases: [
      '忻城'
    ],
    lng: 108.67
  },
  {
    name: '忻府',
    aliases: [
      '忻府'
    ],
    lng: 112.73
  },
  {
    name: '忻州',
    aliases: [
      '忻州'
    ],
    lng: 112.73
  },
  {
    name: '辛集',
    aliases: [
      '辛集'
    ],
    lng: 115.22
  },
  {
    name: '新安',
    aliases: [
      '新安'
    ],
    lng: 112.14
  },
  {
    name: '新北',
    aliases: [
      '新北'
    ],
    lng: 119.97
  },
  {
    name: '新宾',
    aliases: [
      '新宾'
    ],
    lng: 125.04
  },
  {
    name: '新蔡',
    aliases: [
      '新蔡'
    ],
    lng: 114.98
  },
  {
    name: '新昌',
    aliases: [
      '新昌'
    ],
    lng: 120.91
  },
  {
    name: '新都',
    aliases: [
      '新都'
    ],
    lng: 104.16
  },
  {
    name: '新丰',
    aliases: [
      '新丰'
    ],
    lng: 114.21
  },
  {
    name: '新抚',
    aliases: [
      '新抚'
    ],
    lng: 123.9
  },
  {
    name: '新干',
    aliases: [
      '新干'
    ],
    lng: 115.4
  },
  {
    name: '新和',
    aliases: [
      '新和'
    ],
    lng: 82.61
  },
  {
    name: '新河',
    aliases: [
      '新河'
    ],
    lng: 115.25
  },
  {
    name: '新化',
    aliases: [
      '新化'
    ],
    lng: 111.31
  },
  {
    name: '新晃',
    aliases: [
      '新晃'
    ],
    lng: 109.17
  },
  {
    name: '新会',
    aliases: [
      '新会'
    ],
    lng: 113.04
  },
  {
    name: '新建',
    aliases: [
      '新建'
    ],
    lng: 115.82
  },
  {
    name: '新绛',
    aliases: [
      '新绛'
    ],
    lng: 111.23
  },
  {
    name: '新界',
    aliases: [
      '新界'
    ],
    lng: 114.19
  },
  {
    name: '新津',
    aliases: [
      '新津'
    ],
    lng: 103.81
  },
  {
    name: '新乐',
    aliases: [
      '新乐'
    ],
    lng: 114.69
  },
  {
    name: '新龙',
    aliases: [
      '新龙'
    ],
    lng: 100.31
  },
  {
    name: '新罗',
    aliases: [
      '新罗'
    ],
    lng: 117.03
  },
  {
    name: '新密',
    aliases: [
      '新密'
    ],
    lng: 113.38
  },
  {
    name: '新民',
    aliases: [
      '新民'
    ],
    lng: 122.83
  },
  {
    name: '新宁',
    aliases: [
      '新宁'
    ],
    lng: 110.86
  },
  {
    name: '新平',
    aliases: [
      '新平'
    ],
    lng: 101.99
  },
  {
    name: '新青',
    aliases: [
      '新青'
    ],
    lng: 129.53
  },
  {
    name: '新邱',
    aliases: [
      '新邱'
    ],
    lng: 121.79
  },
  {
    name: '新荣',
    aliases: [
      '新荣'
    ],
    lng: 113.14
  },
  {
    name: '新邵',
    aliases: [
      '新邵'
    ],
    lng: 111.46
  },
  {
    name: '新市',
    aliases: [
      '新市'
    ],
    lng: 87.56
  },
  {
    name: '新泰',
    aliases: [
      '新泰'
    ],
    lng: 117.77
  },
  {
    name: '新田',
    aliases: [
      '新田'
    ],
    lng: 112.22
  },
  {
    name: '新吴',
    aliases: [
      '新吴'
    ],
    lng: 120.35
  },
  {
    name: '新县',
    aliases: [
      '新县'
    ],
    lng: 114.88
  },
  {
    name: '新乡',
    aliases: [
      '新乡'
    ],
    lng: 113.81
  },
  {
    name: '新野',
    aliases: [
      '新野'
    ],
    lng: 112.37
  },
  {
    name: '新沂',
    aliases: [
      '新沂'
    ],
    lng: 118.35
  },
  {
    name: '新右旗',
    aliases: [
      '新右旗'
    ],
    lng: 116.49
  },
  {
    name: '新余',
    aliases: [
      '新余'
    ],
    lng: 114.93
  },
  {
    name: '新源',
    aliases: [
      '新源'
    ],
    lng: 83.26
  },
  {
    name: '新郑',
    aliases: [
      '新郑'
    ],
    lng: 113.74
  },
  {
    name: '新洲',
    aliases: [
      '新洲'
    ],
    lng: 114.8
  },
  {
    name: '新竹',
    aliases: [
      '新竹'
    ],
    lng: 120.96
  },
  {
    name: '新左旗',
    aliases: [
      '新左旗'
    ],
    lng: 118.16
  },
  {
    name: '信丰',
    aliases: [
      '信丰'
    ],
    lng: 114.93
  },
  {
    name: '信阳',
    aliases: [
      '信阳'
    ],
    lng: 114.08
  },
  {
    name: '信宜',
    aliases: [
      '信宜'
    ],
    lng: 110.94
  },
  {
    name: '信州',
    aliases: [
      '信州'
    ],
    lng: 117.97
  },
  {
    name: '星子',
    aliases: [
      '星子'
    ],
    lng: 116.03
  },
  {
    name: '行唐',
    aliases: [
      '行唐'
    ],
    lng: 114.55
  },
  {
    name: '邢台',
    aliases: [
      '邢台'
    ],
    lng: 114.56
  },
  {
    name: '荥经',
    aliases: [
      '荥经'
    ],
    lng: 102.84
  },
  {
    name: '荥阳',
    aliases: [
      '荥阳'
    ],
    lng: 113.39
  },
  {
    name: '兴安盟',
    aliases: [
      '兴安盟'
    ],
    lng: 122.07
  },
  {
    name: '兴宾',
    aliases: [
      '兴宾'
    ],
    lng: 109.23
  },
  {
    name: '兴城',
    aliases: [
      '兴城'
    ],
    lng: 120.73
  },
  {
    name: '兴国',
    aliases: [
      '兴国'
    ],
    lng: 115.35
  },
  {
    name: '兴海',
    aliases: [
      '兴海'
    ],
    lng: 99.99
  },
  {
    name: '兴和',
    aliases: [
      '兴和'
    ],
    lng: 113.83
  },
  {
    name: '兴化',
    aliases: [
      '兴化'
    ],
    lng: 119.84
  },
  {
    name: '兴隆',
    aliases: [
      '兴隆'
    ],
    lng: 117.51
  },
  {
    name: '兴隆台',
    aliases: [
      '兴隆台'
    ],
    lng: 122.07
  },
  {
    name: '兴平',
    aliases: [
      '兴平'
    ],
    lng: 108.49
  },
  {
    name: '兴庆',
    aliases: [
      '兴庆'
    ],
    lng: 106.28
  },
  {
    name: '兴仁',
    aliases: [
      '兴仁'
    ],
    lng: 105.19
  },
  {
    name: '兴文',
    aliases: [
      '兴文'
    ],
    lng: 105.24
  },
  {
    name: '兴县',
    aliases: [
      '兴县'
    ],
    lng: 111.12
  },
  {
    name: '兴业',
    aliases: [
      '兴业'
    ],
    lng: 109.88
  },
  {
    name: '兴义',
    aliases: [
      '兴义'
    ],
    lng: 104.9
  },
  {
    name: '杏花岭',
    aliases: [
      '杏花岭'
    ],
    lng: 112.56
  },
  {
    name: '雄县',
    aliases: [
      '雄县'
    ],
    lng: 116.11
  },
  {
    name: '休宁',
    aliases: [
      '休宁'
    ],
    lng: 118.19
  },
  {
    name: '修水',
    aliases: [
      '修水'
    ],
    lng: 114.57
  },
  {
    name: '修文',
    aliases: [
      '修文'
    ],
    lng: 106.6
  },
  {
    name: '修武',
    aliases: [
      '修武'
    ],
    lng: 113.45
  },
  {
    name: '秀峰',
    aliases: [
      '秀峰'
    ],
    lng: 110.29
  },
  {
    name: '秀山',
    aliases: [
      '秀山'
    ],
    lng: 109
  },
  {
    name: '秀英',
    aliases: [
      '秀英'
    ],
    lng: 110.28
  },
  {
    name: '秀屿',
    aliases: [
      '秀屿'
    ],
    lng: 119.09
  },
  {
    name: '秀洲',
    aliases: [
      '秀洲'
    ],
    lng: 120.72
  },
  {
    name: '岫岩',
    aliases: [
      '岫岩'
    ],
    lng: 123.29
  },
  {
    name: '盱眙',
    aliases: [
      '盱眙'
    ],
    lng: 118.49
  },
  {
    name: '徐汇',
    aliases: [
      '徐汇'
    ],
    lng: 121.44
  },
  {
    name: '徐水',
    aliases: [
      '徐水'
    ],
    lng: 115.65
  },
  {
    name: '徐闻',
    aliases: [
      '徐闻'
    ],
    lng: 110.18
  },
  {
    name: '徐州',
    aliases: [
      '徐州'
    ],
    lng: 117.18
  },
  {
    name: '许昌',
    aliases: [
      '许昌'
    ],
    lng: 113.83
  },
  {
    name: '叙永',
    aliases: [
      '叙永'
    ],
    lng: 105.44
  },
  {
    name: '溆浦',
    aliases: [
      '溆浦'
    ],
    lng: 110.59
  },
  {
    name: '宣城',
    aliases: [
      '宣城'
    ],
    lng: 118.76
  },
  {
    name: '宣恩',
    aliases: [
      '宣恩'
    ],
    lng: 109.48
  },
  {
    name: '宣汉',
    aliases: [
      '宣汉'
    ],
    lng: 107.72
  },
  {
    name: '宣化',
    aliases: [
      '宣化'
    ],
    lng: 115.06
  },
  {
    name: '宣威',
    aliases: [
      '宣威'
    ],
    lng: 104.1
  },
  {
    name: '宣州',
    aliases: [
      '宣州'
    ],
    lng: 118.76
  },
  {
    name: '玄武',
    aliases: [
      '玄武'
    ],
    lng: 118.79
  },
  {
    name: '薛城',
    aliases: [
      '薛城'
    ],
    lng: 117.27
  },
  {
    name: '寻甸',
    aliases: [
      '寻甸'
    ],
    lng: 103.26
  },
  {
    name: '寻乌',
    aliases: [
      '寻乌'
    ],
    lng: 115.65
  },
  {
    name: '旬阳',
    aliases: [
      '旬阳'
    ],
    lng: 109.37
  },
  {
    name: '旬邑',
    aliases: [
      '旬邑'
    ],
    lng: 108.34
  },
  {
    name: '浔阳',
    aliases: [
      '浔阳'
    ],
    lng: 116
  },
  {
    name: '循化',
    aliases: [
      '循化'
    ],
    lng: 102.49
  },
  {
    name: '逊克',
    aliases: [
      '逊克'
    ],
    lng: 128.48
  },
  {
    name: '牙克石',
    aliases: [
      '牙克石'
    ],
    lng: 120.73
  },
  {
    name: '崖州',
    aliases: [
      '崖州'
    ],
    lng: 109.17
  },
  {
    name: '雅安',
    aliases: [
      '雅安'
    ],
    lng: 103
  },
  {
    name: '雅江',
    aliases: [
      '雅江'
    ],
    lng: 101.02
  },
  {
    name: '亚东',
    aliases: [
      '亚东'
    ],
    lng: 88.91
  },
  {
    name: '烟台',
    aliases: [
      '烟台'
    ],
    lng: 121.39
  },
  {
    name: '焉耆',
    aliases: [
      '焉耆'
    ],
    lng: 86.57
  },
  {
    name: '鄢陵',
    aliases: [
      '鄢陵'
    ],
    lng: 114.19
  },
  {
    name: '延安',
    aliases: [
      '延安'
    ],
    lng: 109.49
  },
  {
    name: '延边',
    aliases: [
      '延边'
    ],
    lng: 129.51
  },
  {
    name: '延川',
    aliases: [
      '延川'
    ],
    lng: 110.19
  },
  {
    name: '延吉',
    aliases: [
      '延吉'
    ],
    lng: 129.52
  },
  {
    name: '延津',
    aliases: [
      '延津'
    ],
    lng: 114.2
  },
  {
    name: '延平',
    aliases: [
      '延平'
    ],
    lng: 118.18
  },
  {
    name: '延庆',
    aliases: [
      '延庆'
    ],
    lng: 115.99
  },
  {
    name: '延寿',
    aliases: [
      '延寿'
    ],
    lng: 128.33
  },
  {
    name: '延长',
    aliases: [
      '延长'
    ],
    lng: 110.01
  },
  {
    name: '沿河',
    aliases: [
      '沿河'
    ],
    lng: 108.5
  },
  {
    name: '沿滩',
    aliases: [
      '沿滩'
    ],
    lng: 104.88
  },
  {
    name: '炎陵',
    aliases: [
      '炎陵'
    ],
    lng: 113.78
  },
  {
    name: '盐边',
    aliases: [
      '盐边'
    ],
    lng: 101.85
  },
  {
    name: '盐城',
    aliases: [
      '盐城'
    ],
    lng: 120.14
  },
  {
    name: '盐池',
    aliases: [
      '盐池'
    ],
    lng: 107.41
  },
  {
    name: '盐都',
    aliases: [
      '盐都'
    ],
    lng: 120.14
  },
  {
    name: '盐湖',
    aliases: [
      '盐湖'
    ],
    lng: 111
  },
  {
    name: '盐津',
    aliases: [
      '盐津'
    ],
    lng: 104.24
  },
  {
    name: '盐山',
    aliases: [
      '盐山'
    ],
    lng: 117.23
  },
  {
    name: '盐田',
    aliases: [
      '盐田'
    ],
    lng: 114.24
  },
  {
    name: '盐亭',
    aliases: [
      '盐亭'
    ],
    lng: 105.39
  },
  {
    name: '盐源',
    aliases: [
      '盐源'
    ],
    lng: 101.51
  },
  {
    name: '阎良',
    aliases: [
      '阎良'
    ],
    lng: 109.23
  },
  {
    name: '兖州',
    aliases: [
      '兖州'
    ],
    lng: 116.83
  },
  {
    name: '偃师',
    aliases: [
      '偃师'
    ],
    lng: 112.79
  },
  {
    name: '郾城',
    aliases: [
      '郾城'
    ],
    lng: 114.02
  },
  {
    name: '砚山',
    aliases: [
      '砚山'
    ],
    lng: 104.34
  },
  {
    name: '雁峰',
    aliases: [
      '雁峰'
    ],
    lng: 112.61
  },
  {
    name: '雁江',
    aliases: [
      '雁江'
    ],
    lng: 104.64
  },
  {
    name: '雁山',
    aliases: [
      '雁山'
    ],
    lng: 110.31
  },
  {
    name: '雁塔',
    aliases: [
      '雁塔'
    ],
    lng: 108.93
  },
  {
    name: '扬中',
    aliases: [
      '扬中'
    ],
    lng: 119.83
  },
  {
    name: '扬州',
    aliases: [
      '扬州'
    ],
    lng: 119.42
  },
  {
    name: '阳城',
    aliases: [
      '阳城'
    ],
    lng: 112.42
  },
  {
    name: '阳春',
    aliases: [
      '阳春'
    ],
    lng: 111.79
  },
  {
    name: '阳东',
    aliases: [
      '阳东'
    ],
    lng: 112.01
  },
  {
    name: '阳高',
    aliases: [
      '阳高'
    ],
    lng: 113.75
  },
  {
    name: '阳谷',
    aliases: [
      '阳谷'
    ],
    lng: 115.78
  },
  {
    name: '阳江',
    aliases: [
      '阳江'
    ],
    lng: 111.98
  },
  {
    name: '阳明',
    aliases: [
      '阳明'
    ],
    lng: 129.63
  },
  {
    name: '阳曲',
    aliases: [
      '阳曲'
    ],
    lng: 112.67
  },
  {
    name: '阳泉',
    aliases: [
      '阳泉'
    ],
    lng: 113.58
  },
  {
    name: '阳山',
    aliases: [
      '阳山'
    ],
    lng: 112.63
  },
  {
    name: '阳朔',
    aliases: [
      '阳朔'
    ],
    lng: 110.49
  },
  {
    name: '阳西',
    aliases: [
      '阳西'
    ],
    lng: 111.62
  },
  {
    name: '阳新',
    aliases: [
      '阳新'
    ],
    lng: 115.21
  },
  {
    name: '阳信',
    aliases: [
      '阳信'
    ],
    lng: 117.58
  },
  {
    name: '阳原',
    aliases: [
      '阳原'
    ],
    lng: 114.17
  },
  {
    name: '杨凌',
    aliases: [
      '杨凌'
    ],
    lng: 108.07
  },
  {
    name: '杨陵',
    aliases: [
      '杨陵'
    ],
    lng: 108.09
  },
  {
    name: '杨浦',
    aliases: [
      '杨浦'
    ],
    lng: 121.52
  },
  {
    name: '洋县',
    aliases: [
      '洋县'
    ],
    lng: 107.55
  },
  {
    name: '漾濞',
    aliases: [
      '漾濞'
    ],
    lng: 99.96
  },
  {
    name: '尧都',
    aliases: [
      '尧都'
    ],
    lng: 111.52
  },
  {
    name: '姚安',
    aliases: [
      '姚安'
    ],
    lng: 101.24
  },
  {
    name: '瑶海',
    aliases: [
      '瑶海'
    ],
    lng: 117.32
  },
  {
    name: '耀州',
    aliases: [
      '耀州'
    ],
    lng: 108.96
  },
  {
    name: '叶城',
    aliases: [
      '叶城'
    ],
    lng: 77.42
  },
  {
    name: '叶集',
    aliases: [
      '叶集'
    ],
    lng: 115.91
  },
  {
    name: '叶县',
    aliases: [
      '叶县'
    ],
    lng: 113.36
  },
  {
    name: '伊川',
    aliases: [
      '伊川'
    ],
    lng: 112.43
  },
  {
    name: '伊春',
    aliases: [
      '伊春'
    ],
    lng: 128.9
  },
  {
    name: '伊金霍洛',
    aliases: [
      '伊金霍洛'
    ],
    lng: 109.79
  },
  {
    name: '伊犁',
    aliases: [
      '伊犁'
    ],
    lng: 81.32
  },
  {
    name: '伊宁',
    aliases: [
      '伊宁'
    ],
    lng: 81.32
  },
  {
    name: '伊宁县',
    aliases: [
      '伊宁县'
    ],
    lng: 81.52
  },
  {
    name: '伊通',
    aliases: [
      '伊通'
    ],
    lng: 125.3
  },
  {
    name: '伊吾',
    aliases: [
      '伊吾'
    ],
    lng: 94.69
  },
  {
    name: '伊州',
    aliases: [
      '伊州'
    ],
    lng: 93.51
  },
  {
    name: '依安',
    aliases: [
      '依安'
    ],
    lng: 125.31
  },
  {
    name: '依兰',
    aliases: [
      '依兰'
    ],
    lng: 129.57
  },
  {
    name: '黟县',
    aliases: [
      '黟县'
    ],
    lng: 117.94
  },
  {
    name: '仪陇',
    aliases: [
      '仪陇'
    ],
    lng: 106.3
  },
  {
    name: '仪征',
    aliases: [
      '仪征'
    ],
    lng: 119.18
  },
  {
    name: '夷陵',
    aliases: [
      '夷陵'
    ],
    lng: 111.33
  },
  {
    name: '沂南',
    aliases: [
      '沂南'
    ],
    lng: 118.46
  },
  {
    name: '沂水',
    aliases: [
      '沂水'
    ],
    lng: 118.63
  },
  {
    name: '沂源',
    aliases: [
      '沂源'
    ],
    lng: 118.17
  },
  {
    name: '宜宾',
    aliases: [
      '宜宾'
    ],
    lng: 104.63
  },
  {
    name: '宜宾县',
    aliases: [
      '宜宾县'
    ],
    lng: 104.54
  },
  {
    name: '宜昌',
    aliases: [
      '宜昌'
    ],
    lng: 111.29
  },
  {
    name: '宜城',
    aliases: [
      '宜城'
    ],
    lng: 112.26
  },
  {
    name: '宜川',
    aliases: [
      '宜川'
    ],
    lng: 110.18
  },
  {
    name: '宜春',
    aliases: [
      '宜春'
    ],
    lng: 114.39
  },
  {
    name: '宜都',
    aliases: [
      '宜都'
    ],
    lng: 111.45
  },
  {
    name: '宜丰',
    aliases: [
      '宜丰'
    ],
    lng: 114.79
  },
  {
    name: '宜黄',
    aliases: [
      '宜黄'
    ],
    lng: 116.22
  },
  {
    name: '宜君',
    aliases: [
      '宜君'
    ],
    lng: 109.12
  },
  {
    name: '宜兰',
    aliases: [
      '宜兰'
    ],
    lng: 121.74
  },
  {
    name: '宜良',
    aliases: [
      '宜良'
    ],
    lng: 103.15
  },
  {
    name: '宜兴',
    aliases: [
      '宜兴'
    ],
    lng: 119.82
  },
  {
    name: '宜秀',
    aliases: [
      '宜秀'
    ],
    lng: 117.07
  },
  {
    name: '宜阳',
    aliases: [
      '宜阳'
    ],
    lng: 112.18
  },
  {
    name: '宜章',
    aliases: [
      '宜章'
    ],
    lng: 112.95
  },
  {
    name: '宜州',
    aliases: [
      '宜州'
    ],
    lng: 108.65
  },
  {
    name: '彝良',
    aliases: [
      '彝良'
    ],
    lng: 104.05
  },
  {
    name: '义安',
    aliases: [
      '义安'
    ],
    lng: 117.79
  },
  {
    name: '义马',
    aliases: [
      '义马'
    ],
    lng: 111.87
  },
  {
    name: '义乌',
    aliases: [
      '义乌'
    ],
    lng: 120.07
  },
  {
    name: '义县',
    aliases: [
      '义县'
    ],
    lng: 121.24
  },
  {
    name: '弋江',
    aliases: [
      '弋江'
    ],
    lng: 118.38
  },
  {
    name: '弋阳',
    aliases: [
      '弋阳'
    ],
    lng: 117.44
  },
  {
    name: '峄城',
    aliases: [
      '峄城'
    ],
    lng: 117.59
  },
  {
    name: '易门',
    aliases: [
      '易门'
    ],
    lng: 102.16
  },
  {
    name: '易县',
    aliases: [
      '易县'
    ],
    lng: 115.5
  },
  {
    name: '驿城',
    aliases: [
      '驿城'
    ],
    lng: 114.03
  },
  {
    name: '益阳',
    aliases: [
      '益阳'
    ],
    lng: 112.36
  },
  {
    name: '翼城',
    aliases: [
      '翼城'
    ],
    lng: 111.71
  },
  {
    name: '殷都',
    aliases: [
      '殷都'
    ],
    lng: 114.3
  },
  {
    name: '银川',
    aliases: [
      '银川'
    ],
    lng: 106.28
  },
  {
    name: '银海',
    aliases: [
      '银海'
    ],
    lng: 109.12
  },
  {
    name: '银州',
    aliases: [
      '银州'
    ],
    lng: 123.84
  },
  {
    name: '鄞州',
    aliases: [
      '鄞州'
    ],
    lng: 121.56
  },
  {
    name: '印江',
    aliases: [
      '印江'
    ],
    lng: 108.41
  },
  {
    name: '印台',
    aliases: [
      '印台'
    ],
    lng: 109.1
  },
  {
    name: '应城',
    aliases: [
      '应城'
    ],
    lng: 113.57
  },
  {
    name: '应县',
    aliases: [
      '应县'
    ],
    lng: 113.19
  },
  {
    name: '英德',
    aliases: [
      '英德'
    ],
    lng: 113.41
  },
  {
    name: '英吉沙',
    aliases: [
      '英吉沙'
    ],
    lng: 76.17
  },
  {
    name: '英山',
    aliases: [
      '英山'
    ],
    lng: 115.68
  },
  {
    name: '鹰手营子矿',
    aliases: [
      '鹰手营子矿'
    ],
    lng: 117.66
  },
  {
    name: '鹰潭',
    aliases: [
      '鹰潭'
    ],
    lng: 117.03
  },
  {
    name: '迎江',
    aliases: [
      '迎江'
    ],
    lng: 117.04
  },
  {
    name: '迎泽',
    aliases: [
      '迎泽'
    ],
    lng: 112.56
  },
  {
    name: '盈江',
    aliases: [
      '盈江'
    ],
    lng: 97.93
  },
  {
    name: '营口',
    aliases: [
      '营口'
    ],
    lng: 122.24
  },
  {
    name: '营山',
    aliases: [
      '营山'
    ],
    lng: 106.56
  },
  {
    name: '颍东',
    aliases: [
      '颍东'
    ],
    lng: 115.86
  },
  {
    name: '颍泉',
    aliases: [
      '颍泉'
    ],
    lng: 115.8
  },
  {
    name: '颍上',
    aliases: [
      '颍上'
    ],
    lng: 116.26
  },
  {
    name: '颍州',
    aliases: [
      '颍州'
    ],
    lng: 115.81
  },
  {
    name: '邕宁',
    aliases: [
      '邕宁'
    ],
    lng: 108.48
  },
  {
    name: '永安',
    aliases: [
      '永安'
    ],
    lng: 117.36
  },
  {
    name: '永昌',
    aliases: [
      '永昌'
    ],
    lng: 101.97
  },
  {
    name: '永城',
    aliases: [
      '永城'
    ],
    lng: 116.45
  },
  {
    name: '永川',
    aliases: [
      '永川'
    ],
    lng: 105.89
  },
  {
    name: '永春',
    aliases: [
      '永春'
    ],
    lng: 118.3
  },
  {
    name: '永德',
    aliases: [
      '永德'
    ],
    lng: 99.25
  },
  {
    name: '永登',
    aliases: [
      '永登'
    ],
    lng: 103.26
  },
  {
    name: '永丰',
    aliases: [
      '永丰'
    ],
    lng: 115.44
  },
  {
    name: '永福',
    aliases: [
      '永福'
    ],
    lng: 109.99
  },
  {
    name: '永和',
    aliases: [
      '永和'
    ],
    lng: 110.63
  },
  {
    name: '永吉',
    aliases: [
      '永吉'
    ],
    lng: 126.5
  },
  {
    name: '永济',
    aliases: [
      '永济'
    ],
    lng: 110.45
  },
  {
    name: '永嘉',
    aliases: [
      '永嘉'
    ],
    lng: 120.69
  },
  {
    name: '永靖',
    aliases: [
      '永靖'
    ],
    lng: 103.32
  },
  {
    name: '永康',
    aliases: [
      '永康'
    ],
    lng: 120.04
  },
  {
    name: '永年',
    aliases: [
      '永年'
    ],
    lng: 114.5
  },
  {
    name: '永宁',
    aliases: [
      '永宁'
    ],
    lng: 106.25
  },
  {
    name: '永平',
    aliases: [
      '永平'
    ],
    lng: 99.53
  },
  {
    name: '永清',
    aliases: [
      '永清'
    ],
    lng: 116.5
  },
  {
    name: '永仁',
    aliases: [
      '永仁'
    ],
    lng: 101.67
  },
  {
    name: '永善',
    aliases: [
      '永善'
    ],
    lng: 103.64
  },
  {
    name: '永胜',
    aliases: [
      '永胜'
    ],
    lng: 100.75
  },
  {
    name: '永寿',
    aliases: [
      '永寿'
    ],
    lng: 108.14
  },
  {
    name: '永顺',
    aliases: [
      '永顺'
    ],
    lng: 109.85
  },
  {
    name: '永泰',
    aliases: [
      '永泰'
    ],
    lng: 118.94
  },
  {
    name: '永新',
    aliases: [
      '永新'
    ],
    lng: 114.24
  },
  {
    name: '永兴',
    aliases: [
      '永兴'
    ],
    lng: 113.11
  },
  {
    name: '永修',
    aliases: [
      '永修'
    ],
    lng: 115.81
  },
  {
    name: '永州',
    aliases: [
      '永州'
    ],
    lng: 111.61
  },
  {
    name: '埇桥',
    aliases: [
      '埇桥'
    ],
    lng: 116.98
  },
  {
    name: '攸县',
    aliases: [
      '攸县'
    ],
    lng: 113.35
  },
  {
    name: '尤溪',
    aliases: [
      '尤溪'
    ],
    lng: 118.19
  },
  {
    name: '游仙',
    aliases: [
      '游仙'
    ],
    lng: 104.77
  },
  {
    name: '友好',
    aliases: [
      '友好'
    ],
    lng: 128.84
  },
  {
    name: '友谊',
    aliases: [
      '友谊'
    ],
    lng: 131.81
  },
  {
    name: '酉阳',
    aliases: [
      '酉阳'
    ],
    lng: 108.77
  },
  {
    name: '右江',
    aliases: [
      '右江'
    ],
    lng: 106.62
  },
  {
    name: '右玉',
    aliases: [
      '右玉'
    ],
    lng: 112.47
  },
  {
    name: '于都',
    aliases: [
      '于都'
    ],
    lng: 115.41
  },
  {
    name: '于洪',
    aliases: [
      '于洪'
    ],
    lng: 123.31
  },
  {
    name: '于田',
    aliases: [
      '于田'
    ],
    lng: 81.67
  },
  {
    name: '余干',
    aliases: [
      '余干'
    ],
    lng: 116.69
  },
  {
    name: '余杭',
    aliases: [
      '余杭'
    ],
    lng: 120.3
  },
  {
    name: '余江',
    aliases: [
      '余江'
    ],
    lng: 116.82
  },
  {
    name: '余庆',
    aliases: [
      '余庆'
    ],
    lng: 107.89
  },
  {
    name: '余姚',
    aliases: [
      '余姚'
    ],
    lng: 121.16
  },
  {
    name: '盂县',
    aliases: [
      '盂县'
    ],
    lng: 113.41
  },
  {
    name: '鱼峰',
    aliases: [
      '鱼峰'
    ],
    lng: 109.42
  },
  {
    name: '鱼台',
    aliases: [
      '鱼台'
    ],
    lng: 116.65
  },
  {
    name: '渝北',
    aliases: [
      '渝北'
    ],
    lng: 106.51
  },
  {
    name: '渝水',
    aliases: [
      '渝水'
    ],
    lng: 114.92
  },
  {
    name: '渝中',
    aliases: [
      '渝中'
    ],
    lng: 106.56
  },
  {
    name: '榆次',
    aliases: [
      '榆次'
    ],
    lng: 112.74
  },
  {
    name: '榆林',
    aliases: [
      '榆林'
    ],
    lng: 109.74
  },
  {
    name: '榆社',
    aliases: [
      '榆社'
    ],
    lng: 112.97
  },
  {
    name: '榆树',
    aliases: [
      '榆树'
    ],
    lng: 126.55
  },
  {
    name: '榆阳',
    aliases: [
      '榆阳'
    ],
    lng: 109.75
  },
  {
    name: '榆中',
    aliases: [
      '榆中'
    ],
    lng: 104.11
  },
  {
    name: '虞城',
    aliases: [
      '虞城'
    ],
    lng: 115.86
  },
  {
    name: '雨城',
    aliases: [
      '雨城'
    ],
    lng: 103
  },
  {
    name: '雨湖',
    aliases: [
      '雨湖'
    ],
    lng: 112.91
  },
  {
    name: '雨花',
    aliases: [
      '雨花'
    ],
    lng: 113.02
  },
  {
    name: '雨花台',
    aliases: [
      '雨花台'
    ],
    lng: 118.77
  },
  {
    name: '雨山',
    aliases: [
      '雨山'
    ],
    lng: 118.49
  },
  {
    name: '禹城',
    aliases: [
      '禹城'
    ],
    lng: 116.64
  },
  {
    name: '禹会',
    aliases: [
      '禹会'
    ],
    lng: 117.35
  },
  {
    name: '禹王台',
    aliases: [
      '禹王台'
    ],
    lng: 114.35
  },
  {
    name: '禹州',
    aliases: [
      '禹州'
    ],
    lng: 113.47
  },
  {
    name: '玉环',
    aliases: [
      '玉环'
    ],
    lng: 121.23
  },
  {
    name: '玉林',
    aliases: [
      '玉林'
    ],
    lng: 110.15
  },
  {
    name: '玉龙',
    aliases: [
      '玉龙'
    ],
    lng: 100.24
  },
  {
    name: '玉门',
    aliases: [
      '玉门'
    ],
    lng: 97.04
  },
  {
    name: '玉屏',
    aliases: [
      '玉屏'
    ],
    lng: 108.92
  },
  {
    name: '玉泉',
    aliases: [
      '玉泉'
    ],
    lng: 111.67
  },
  {
    name: '玉山',
    aliases: [
      '玉山'
    ],
    lng: 118.24
  },
  {
    name: '玉树',
    aliases: [
      '玉树'
    ],
    lng: 97.01
  },
  {
    name: '玉田',
    aliases: [
      '玉田'
    ],
    lng: 117.75
  },
  {
    name: '玉溪',
    aliases: [
      '玉溪'
    ],
    lng: 102.54
  },
  {
    name: '玉州',
    aliases: [
      '玉州'
    ],
    lng: 110.15
  },
  {
    name: '郁南',
    aliases: [
      '郁南'
    ],
    lng: 111.54
  },
  {
    name: '裕安',
    aliases: [
      '裕安'
    ],
    lng: 116.49
  },
  {
    name: '裕华',
    aliases: [
      '裕华'
    ],
    lng: 114.53
  },
  {
    name: '裕民',
    aliases: [
      '裕民'
    ],
    lng: 82.98
  },
  {
    name: '元宝',
    aliases: [
      '元宝'
    ],
    lng: 124.4
  },
  {
    name: '元宝山',
    aliases: [
      '元宝山'
    ],
    lng: 119.29
  },
  {
    name: '元江',
    aliases: [
      '元江'
    ],
    lng: 102
  },
  {
    name: '元谋',
    aliases: [
      '元谋'
    ],
    lng: 101.87
  },
  {
    name: '元氏',
    aliases: [
      '元氏'
    ],
    lng: 114.53
  },
  {
    name: '元阳',
    aliases: [
      '元阳'
    ],
    lng: 102.84
  },
  {
    name: '沅江',
    aliases: [
      '沅江'
    ],
    lng: 112.36
  },
  {
    name: '沅陵',
    aliases: [
      '沅陵'
    ],
    lng: 110.4
  },
  {
    name: '垣曲',
    aliases: [
      '垣曲'
    ],
    lng: 111.67
  },
  {
    name: '原平',
    aliases: [
      '原平'
    ],
    lng: 112.71
  },
  {
    name: '原阳',
    aliases: [
      '原阳'
    ],
    lng: 113.97
  },
  {
    name: '原州',
    aliases: [
      '原州'
    ],
    lng: 106.28
  },
  {
    name: '袁州',
    aliases: [
      '袁州'
    ],
    lng: 114.39
  },
  {
    name: '源城',
    aliases: [
      '源城'
    ],
    lng: 114.7
  },
  {
    name: '源汇',
    aliases: [
      '源汇'
    ],
    lng: 114.02
  },
  {
    name: '远安',
    aliases: [
      '远安'
    ],
    lng: 111.64
  },
  {
    name: '月湖',
    aliases: [
      '月湖'
    ],
    lng: 117.03
  },
  {
    name: '岳池',
    aliases: [
      '岳池'
    ],
    lng: 106.44
  },
  {
    name: '岳麓',
    aliases: [
      '岳麓'
    ],
    lng: 112.91
  },
  {
    name: '岳普湖',
    aliases: [
      '岳普湖'
    ],
    lng: 76.77
  },
  {
    name: '岳塘',
    aliases: [
      '岳塘'
    ],
    lng: 112.93
  },
  {
    name: '岳西',
    aliases: [
      '岳西'
    ],
    lng: 116.36
  },
  {
    name: '岳阳',
    aliases: [
      '岳阳'
    ],
    lng: 113.13
  },
  {
    name: '岳阳楼区',
    aliases: [
      '岳阳楼区'
    ],
    lng: 113.12
  },
  {
    name: '越城',
    aliases: [
      '越城'
    ],
    lng: 120.59
  },
  {
    name: '越西',
    aliases: [
      '越西'
    ],
    lng: 102.51
  },
  {
    name: '越秀',
    aliases: [
      '越秀'
    ],
    lng: 113.28
  },
  {
    name: '云安',
    aliases: [
      '云安'
    ],
    lng: 112.01
  },
  {
    name: '云城',
    aliases: [
      '云城'
    ],
    lng: 112.04
  },
  {
    name: '云浮',
    aliases: [
      '云浮'
    ],
    lng: 112.04
  },
  {
    name: '云和',
    aliases: [
      '云和'
    ],
    lng: 119.57
  },
  {
    name: '云林',
    aliases: [
      '云林'
    ],
    lng: 120.54
  },
  {
    name: '云梦',
    aliases: [
      '云梦'
    ],
    lng: 113.75
  },
  {
    name: '云溪',
    aliases: [
      '云溪'
    ],
    lng: 113.27
  },
  {
    name: '云县',
    aliases: [
      '云县'
    ],
    lng: 100.13
  },
  {
    name: '云霄',
    aliases: [
      '云霄'
    ],
    lng: 117.34
  },
  {
    name: '云岩',
    aliases: [
      '云岩'
    ],
    lng: 106.71
  },
  {
    name: '云阳',
    aliases: [
      '云阳'
    ],
    lng: 108.7
  },
  {
    name: '郧西',
    aliases: [
      '郧西'
    ],
    lng: 110.43
  },
  {
    name: '郧阳',
    aliases: [
      '郧阳'
    ],
    lng: 110.81
  },
  {
    name: '筠连',
    aliases: [
      '筠连'
    ],
    lng: 104.51
  },
  {
    name: '运城',
    aliases: [
      '运城'
    ],
    lng: 111
  },
  {
    name: '运河',
    aliases: [
      '运河'
    ],
    lng: 116.84
  },
  {
    name: '郓城',
    aliases: [
      '郓城'
    ],
    lng: 115.94
  },
  {
    name: '杂多',
    aliases: [
      '杂多'
    ],
    lng: 95.29
  },
  {
    name: '赞皇',
    aliases: [
      '赞皇'
    ],
    lng: 114.39
  },
  {
    name: '枣强',
    aliases: [
      '枣强'
    ],
    lng: 115.73
  },
  {
    name: '枣阳',
    aliases: [
      '枣阳'
    ],
    lng: 112.77
  },
  {
    name: '枣庄',
    aliases: [
      '枣庄'
    ],
    lng: 117.56
  },
  {
    name: '泽库',
    aliases: [
      '泽库'
    ],
    lng: 101.47
  },
  {
    name: '泽普',
    aliases: [
      '泽普'
    ],
    lng: 77.27
  },
  {
    name: '泽州',
    aliases: [
      '泽州'
    ],
    lng: 112.9
  },
  {
    name: '增城',
    aliases: [
      '增城'
    ],
    lng: 113.83
  },
  {
    name: '扎赉诺尔',
    aliases: [
      '扎赉诺尔'
    ],
    lng: 117.72
  },
  {
    name: '扎赉特',
    aliases: [
      '扎赉特'
    ],
    lng: 122.91
  },
  {
    name: '扎兰屯',
    aliases: [
      '扎兰屯'
    ],
    lng: 122.74
  },
  {
    name: '扎鲁特',
    aliases: [
      '扎鲁特'
    ],
    lng: 120.91
  },
  {
    name: '扎囊',
    aliases: [
      '扎囊'
    ],
    lng: 91.34
  },
  {
    name: '札达',
    aliases: [
      '札达'
    ],
    lng: 79.8
  },
  {
    name: '柞水',
    aliases: [
      '柞水'
    ],
    lng: 109.11
  },
  {
    name: '沾化',
    aliases: [
      '沾化'
    ],
    lng: 118.13
  },
  {
    name: '沾益',
    aliases: [
      '沾益'
    ],
    lng: 103.82
  },
  {
    name: '站前',
    aliases: [
      '站前'
    ],
    lng: 122.25
  },
  {
    name: '湛河',
    aliases: [
      '湛河'
    ],
    lng: 113.32
  },
  {
    name: '湛江',
    aliases: [
      '湛江'
    ],
    lng: 110.36
  },
  {
    name: '张北',
    aliases: [
      '张北'
    ],
    lng: 114.72
  },
  {
    name: '张店',
    aliases: [
      '张店'
    ],
    lng: 118.05
  },
  {
    name: '张家川',
    aliases: [
      '张家川'
    ],
    lng: 106.21
  },
  {
    name: '张家港',
    aliases: [
      '张家港'
    ],
    lng: 120.54
  },
  {
    name: '张家界',
    aliases: [
      '张家界'
    ],
    lng: 110.48
  },
  {
    name: '张家口',
    aliases: [
      '张家口'
    ],
    lng: 114.88
  },
  {
    name: '张湾',
    aliases: [
      '张湾'
    ],
    lng: 110.77
  },
  {
    name: '张掖',
    aliases: [
      '张掖'
    ],
    lng: 100.46
  },
  {
    name: '章贡',
    aliases: [
      '章贡'
    ],
    lng: 114.94
  },
  {
    name: '章丘',
    aliases: [
      '章丘'
    ],
    lng: 117.54
  },
  {
    name: '彰化',
    aliases: [
      '彰化'
    ],
    lng: 120.54
  },
  {
    name: '彰武',
    aliases: [
      '彰武'
    ],
    lng: 122.54
  },
  {
    name: '漳平',
    aliases: [
      '漳平'
    ],
    lng: 117.42
  },
  {
    name: '漳浦',
    aliases: [
      '漳浦'
    ],
    lng: 117.61
  },
  {
    name: '漳县',
    aliases: [
      '漳县'
    ],
    lng: 104.47
  },
  {
    name: '漳州',
    aliases: [
      '漳州'
    ],
    lng: 117.66
  },
  {
    name: '樟树',
    aliases: [
      '樟树'
    ],
    lng: 115.54
  },
  {
    name: '长白',
    aliases: [
      '长白'
    ],
    lng: 128.2
  },
  {
    name: '长春',
    aliases: [
      '长春'
    ],
    lng: 125.32
  },
  {
    name: '长岛',
    aliases: [
      '长岛'
    ],
    lng: 120.74
  },
  {
    name: '长丰',
    aliases: [
      '长丰'
    ],
    lng: 117.16
  },
  {
    name: '长葛',
    aliases: [
      '长葛'
    ],
    lng: 113.77
  },
  {
    name: '长海',
    aliases: [
      '长海'
    ],
    lng: 122.59
  },
  {
    name: '长乐',
    aliases: [
      '长乐'
    ],
    lng: 119.51
  },
  {
    name: '长岭',
    aliases: [
      '长岭'
    ],
    lng: 123.99
  },
  {
    name: '长清',
    aliases: [
      '长清'
    ],
    lng: 116.75
  },
  {
    name: '长沙',
    aliases: [
      '长沙'
    ],
    lng: 112.98
  },
  {
    name: '长沙县',
    aliases: [
      '长沙县'
    ],
    lng: 113.08
  },
  {
    name: '长寿',
    aliases: [
      '长寿'
    ],
    lng: 107.07
  },
  {
    name: '长顺',
    aliases: [
      '长顺'
    ],
    lng: 106.45
  },
  {
    name: '长泰',
    aliases: [
      '长泰'
    ],
    lng: 117.76
  },
  {
    name: '长汀',
    aliases: [
      '长汀'
    ],
    lng: 116.36
  },
  {
    name: '长武',
    aliases: [
      '长武'
    ],
    lng: 107.8
  },
  {
    name: '长兴',
    aliases: [
      '长兴'
    ],
    lng: 119.91
  },
  {
    name: '长阳',
    aliases: [
      '长阳'
    ],
    lng: 111.2
  },
  {
    name: '长垣',
    aliases: [
      '长垣'
    ],
    lng: 114.67
  },
  {
    name: '长治',
    aliases: [
      '长治'
    ],
    lng: 113.11
  },
  {
    name: '长洲',
    aliases: [
      '长洲'
    ],
    lng: 111.28
  },
  {
    name: '长子',
    aliases: [
      '长子'
    ],
    lng: 112.88
  },
  {
    name: '招远',
    aliases: [
      '招远'
    ],
    lng: 120.4
  },
  {
    name: '昭化',
    aliases: [
      '昭化'
    ],
    lng: 105.96
  },
  {
    name: '昭觉',
    aliases: [
      '昭觉'
    ],
    lng: 102.84
  },
  {
    name: '昭平',
    aliases: [
      '昭平'
    ],
    lng: 110.81
  },
  {
    name: '昭苏',
    aliases: [
      '昭苏'
    ],
    lng: 81.13
  },
  {
    name: '昭通',
    aliases: [
      '昭通'
    ],
    lng: 103.72
  },
  {
    name: '昭阳',
    aliases: [
      '昭阳'
    ],
    lng: 103.72
  },
  {
    name: '召陵',
    aliases: [
      '召陵'
    ],
    lng: 114.05
  },
  {
    name: '诏安',
    aliases: [
      '诏安'
    ],
    lng: 117.18
  },
  {
    name: '赵县',
    aliases: [
      '赵县'
    ],
    lng: 114.78
  },
  {
    name: '肇东',
    aliases: [
      '肇东'
    ],
    lng: 125.99
  },
  {
    name: '肇庆',
    aliases: [
      '肇庆'
    ],
    lng: 112.47
  },
  {
    name: '肇源',
    aliases: [
      '肇源'
    ],
    lng: 125.08
  },
  {
    name: '肇州',
    aliases: [
      '肇州'
    ],
    lng: 125.27
  },
  {
    name: '柘城',
    aliases: [
      '柘城'
    ],
    lng: 115.31
  },
  {
    name: '柘荣',
    aliases: [
      '柘荣'
    ],
    lng: 119.9
  },
  {
    name: '贞丰',
    aliases: [
      '贞丰'
    ],
    lng: 105.65
  },
  {
    name: '浈江',
    aliases: [
      '浈江'
    ],
    lng: 113.6
  },
  {
    name: '振安',
    aliases: [
      '振安'
    ],
    lng: 124.43
  },
  {
    name: '振兴',
    aliases: [
      '振兴'
    ],
    lng: 124.36
  },
  {
    name: '镇安',
    aliases: [
      '镇安'
    ],
    lng: 109.15
  },
  {
    name: '镇巴',
    aliases: [
      '镇巴'
    ],
    lng: 107.9
  },
  {
    name: '镇海',
    aliases: [
      '镇海'
    ],
    lng: 121.71
  },
  {
    name: '镇江',
    aliases: [
      '镇江'
    ],
    lng: 119.45
  },
  {
    name: '镇康',
    aliases: [
      '镇康'
    ],
    lng: 98.83
  },
  {
    name: '镇赉',
    aliases: [
      '镇赉'
    ],
    lng: 123.2
  },
  {
    name: '镇宁',
    aliases: [
      '镇宁'
    ],
    lng: 105.77
  },
  {
    name: '镇平',
    aliases: [
      '镇平'
    ],
    lng: 112.23
  },
  {
    name: '镇坪',
    aliases: [
      '镇坪'
    ],
    lng: 109.53
  },
  {
    name: '镇雄',
    aliases: [
      '镇雄'
    ],
    lng: 104.87
  },
  {
    name: '镇沅',
    aliases: [
      '镇沅'
    ],
    lng: 101.11
  },
  {
    name: '镇原',
    aliases: [
      '镇原'
    ],
    lng: 107.2
  },
  {
    name: '镇远',
    aliases: [
      '镇远'
    ],
    lng: 108.42
  },
  {
    name: '蒸湘',
    aliases: [
      '蒸湘'
    ],
    lng: 112.57
  },
  {
    name: '正安',
    aliases: [
      '正安'
    ],
    lng: 107.44
  },
  {
    name: '正定',
    aliases: [
      '正定'
    ],
    lng: 114.57
  },
  {
    name: '正蓝旗',
    aliases: [
      '正蓝旗'
    ],
    lng: 116
  },
  {
    name: '正宁',
    aliases: [
      '正宁'
    ],
    lng: 108.36
  },
  {
    name: '正镶白旗',
    aliases: [
      '正镶白旗'
    ],
    lng: 115.03
  },
  {
    name: '正阳',
    aliases: [
      '正阳'
    ],
    lng: 114.39
  },
  {
    name: '郑州',
    aliases: [
      '郑州'
    ],
    lng: 113.67
  },
  {
    name: '政和',
    aliases: [
      '政和'
    ],
    lng: 118.86
  },
  {
    name: '芝罘',
    aliases: [
      '芝罘'
    ],
    lng: 121.39
  },
  {
    name: '枝江',
    aliases: [
      '枝江'
    ],
    lng: 111.75
  },
  {
    name: '织金',
    aliases: [
      '织金'
    ],
    lng: 105.77
  },
  {
    name: '芷江',
    aliases: [
      '芷江'
    ],
    lng: 109.69
  },
  {
    name: '志丹',
    aliases: [
      '志丹'
    ],
    lng: 108.77
  },
  {
    name: '治多',
    aliases: [
      '治多'
    ],
    lng: 95.62
  },
  {
    name: '中方',
    aliases: [
      '中方'
    ],
    lng: 109.95
  },
  {
    name: '中江',
    aliases: [
      '中江'
    ],
    lng: 104.68
  },
  {
    name: '中牟',
    aliases: [
      '中牟'
    ],
    lng: 114.02
  },
  {
    name: '中宁',
    aliases: [
      '中宁'
    ],
    lng: 105.68
  },
  {
    name: '中沙',
    aliases: [
      '中沙'
    ],
    lng: 117.74
  },
  {
    name: '中卫',
    aliases: [
      '中卫'
    ],
    lng: 105.19
  },
  {
    name: '中阳',
    aliases: [
      '中阳'
    ],
    lng: 111.19
  },
  {
    name: '中原',
    aliases: [
      '中原'
    ],
    lng: 113.61
  },
  {
    name: '中站',
    aliases: [
      '中站'
    ],
    lng: 113.18
  },
  {
    name: '忠县',
    aliases: [
      '忠县'
    ],
    lng: 108.04
  },
  {
    name: '钟楼',
    aliases: [
      '钟楼'
    ],
    lng: 119.95
  },
  {
    name: '钟祥',
    aliases: [
      '钟祥'
    ],
    lng: 112.59
  },
  {
    name: '仲巴',
    aliases: [
      '仲巴'
    ],
    lng: 84.03
  },
  {
    name: '舟曲',
    aliases: [
      '舟曲'
    ],
    lng: 104.37
  },
  {
    name: '舟山',
    aliases: [
      '舟山'
    ],
    lng: 122.11
  },
  {
    name: '周村',
    aliases: [
      '周村'
    ],
    lng: 117.85
  },
  {
    name: '周口',
    aliases: [
      '周口'
    ],
    lng: 114.65
  },
  {
    name: '周宁',
    aliases: [
      '周宁'
    ],
    lng: 119.34
  },
  {
    name: '周至',
    aliases: [
      '周至'
    ],
    lng: 108.22
  },
  {
    name: '株洲',
    aliases: [
      '株洲'
    ],
    lng: 113.15
  },
  {
    name: '珠海',
    aliases: [
      '珠海'
    ],
    lng: 113.55
  },
  {
    name: '珠晖',
    aliases: [
      '珠晖'
    ],
    lng: 112.63
  },
  {
    name: '珠山',
    aliases: [
      '珠山'
    ],
    lng: 117.21
  },
  {
    name: '诸城',
    aliases: [
      '诸城'
    ],
    lng: 119.4
  },
  {
    name: '诸暨',
    aliases: [
      '诸暨'
    ],
    lng: 120.24
  },
  {
    name: '竹山',
    aliases: [
      '竹山'
    ],
    lng: 110.23
  },
  {
    name: '竹溪',
    aliases: [
      '竹溪'
    ],
    lng: 109.72
  },
  {
    name: '驻马店',
    aliases: [
      '驻马店'
    ],
    lng: 114.02
  },
  {
    name: '庄河',
    aliases: [
      '庄河'
    ],
    lng: 122.97
  },
  {
    name: '庄浪',
    aliases: [
      '庄浪'
    ],
    lng: 106.04
  },
  {
    name: '准格尔',
    aliases: [
      '准格尔'
    ],
    lng: 111.24
  },
  {
    name: '涿鹿',
    aliases: [
      '涿鹿'
    ],
    lng: 115.22
  },
  {
    name: '涿州',
    aliases: [
      '涿州'
    ],
    lng: 115.97
  },
  {
    name: '卓尼',
    aliases: [
      '卓尼'
    ],
    lng: 103.51
  },
  {
    name: '卓资',
    aliases: [
      '卓资'
    ],
    lng: 112.58
  },
  {
    name: '资溪',
    aliases: [
      '资溪'
    ],
    lng: 117.07
  },
  {
    name: '资兴',
    aliases: [
      '资兴'
    ],
    lng: 113.24
  },
  {
    name: '资源',
    aliases: [
      '资源'
    ],
    lng: 110.64
  },
  {
    name: '资中',
    aliases: [
      '资中'
    ],
    lng: 104.85
  },
  {
    name: '淄博',
    aliases: [
      '淄博'
    ],
    lng: 118.05
  },
  {
    name: '淄川',
    aliases: [
      '淄川'
    ],
    lng: 117.97
  },
  {
    name: '子长',
    aliases: [
      '子长'
    ],
    lng: 109.68
  },
  {
    name: '子洲',
    aliases: [
      '子洲'
    ],
    lng: 110.03
  },
  {
    name: '秭归',
    aliases: [
      '秭归'
    ],
    lng: 110.98
  },
  {
    name: '梓潼',
    aliases: [
      '梓潼'
    ],
    lng: 105.16
  },
  {
    name: '紫金',
    aliases: [
      '紫金'
    ],
    lng: 115.18
  },
  {
    name: '紫阳',
    aliases: [
      '紫阳'
    ],
    lng: 108.54
  },
  {
    name: '紫云',
    aliases: [
      '紫云'
    ],
    lng: 106.08
  },
  {
    name: '自贡',
    aliases: [
      '自贡'
    ],
    lng: 104.77
  },
  {
    name: '自流井',
    aliases: [
      '自流井'
    ],
    lng: 104.78
  },
  {
    name: '邹城',
    aliases: [
      '邹城'
    ],
    lng: 116.97
  },
  {
    name: '邹平',
    aliases: [
      '邹平'
    ],
    lng: 117.74
  },
  {
    name: '遵化',
    aliases: [
      '遵化'
    ],
    lng: 117.97
  },
  {
    name: '遵义',
    aliases: [
      '遵义'
    ],
    lng: 106.94
  },
  {
    name: '遵义县',
    aliases: [
      '遵义县'
    ],
    lng: 106.49
  },
  {
    name: '左贡',
    aliases: [
      '左贡'
    ],
    lng: 97.84
  },
  {
    name: '左权',
    aliases: [
      '左权'
    ],
    lng: 113.38
  },
  {
    name: '左云',
    aliases: [
      '左云'
    ],
    lng: 112.71
  }
];
