// src/data/cityTranslations.js
/**
 * 한글-영문 도시명 매핑 데이터
 * 한글 도시명을 키로 하고, 영문 도시명과 국가코드를 값으로 가지는 객체
 */

// 국가 코드와 한글/영문 국가명 매핑
const countryMapping = {
  'KR': { ko: '한국', en: 'Korea' },
  'JP': { ko: '일본', en: 'Japan' },
  'CN': { ko: '중국', en: 'China' },
  'US': { ko: '미국', en: 'United States' },
  'CA': { ko: '캐나다', en: 'Canada' },
  'GB': { ko: '영국', en: 'United Kingdom' },
  'FR': { ko: '프랑스', en: 'France' },
  'DE': { ko: '독일', en: 'Germany' },
  'IT': { ko: '이탈리아', en: 'Italy' },
  'ES': { ko: '스페인', en: 'Spain' },
  'AU': { ko: '호주', en: 'Australia' },
  'NZ': { ko: '뉴질랜드', en: 'New Zealand' },
  'TH': { ko: '태국', en: 'Thailand' },
  'VN': { ko: '베트남', en: 'Vietnam' },
  'SG': { ko: '싱가포르', en: 'Singapore' },
  'MY': { ko: '말레이시아', en: 'Malaysia' },
  'ID': { ko: '인도네시아', en: 'Indonesia' },
  'PH': { ko: '필리핀', en: 'Philippines' },
  'IN': { ko: '인도', en: 'India' },
  'TR': { ko: '터키', en: 'Turkey' },
  'GR': { ko: '그리스', en: 'Greece' },
  'RU': { ko: '러시아', en: 'Russia' },
  'NL': { ko: '네덜란드', en: 'Netherlands' },
  'BE': { ko: '벨기에', en: 'Belgium' },
  'CH': { ko: '스위스', en: 'Switzerland' },
  'AT': { ko: '오스트리아', en: 'Austria' },
  'CZ': { ko: '체코', en: 'Czech Republic' },
  'HU': { ko: '헝가리', en: 'Hungary' },
  'PL': { ko: '폴란드', en: 'Poland' },
  'PT': { ko: '포르투갈', en: 'Portugal' },
  'BR': { ko: '브라질', en: 'Brazil' },
  'MX': { ko: '멕시코', en: 'Mexico' },
  'AR': { ko: '아르헨티나', en: 'Argentina' },
  'CL': { ko: '칠레', en: 'Chile' },
  'PE': { ko: '페루', en: 'Peru' },
  'CO': { ko: '콜롬비아', en: 'Colombia' },
  'EG': { ko: '이집트', en: 'Egypt' },
  'ZA': { ko: '남아프리카', en: 'South Africa' },
  'KE': { ko: '케냐', en: 'Kenya' },
  'AE': { ko: 'UAE', en: 'United Arab Emirates' },
  'IL': { ko: '이스라엘', en: 'Israel' },
  'SA': { ko: '사우디아라비아', en: 'Saudi Arabia' },
  'HK': { ko: '홍콩', en: 'Hong Kong' },
  'TW': { ko: '대만', en: 'Taiwan' },

    // 유럽
  'AD': { ko: '안도라', en: 'Andorra' },
  'AL': { ko: '알바니아', en: 'Albania' },
  'AM': { ko: '아르메니아', en: 'Armenia' },
  'BA': { ko: '보스니아 헤르체고비나', en: 'Bosnia and Herzegovina' },
  'BG': { ko: '불가리아', en: 'Bulgaria' },
  'BY': { ko: '벨라루스', en: 'Belarus' },
  'CY': { ko: '키프로스', en: 'Cyprus' },
  'DK': { ko: '덴마크', en: 'Denmark' },
  'EE': { ko: '에스토니아', en: 'Estonia' },
  'FI': { ko: '핀란드', en: 'Finland' },
  'FO': { ko: '페로 제도', en: 'Faroe Islands' },
  'GI': { ko: '지브롤터', en: 'Gibraltar' },
  'HR': { ko: '크로아티아', en: 'Croatia' },
  'IE': { ko: '아일랜드', en: 'Ireland' },
  'IS': { ko: '아이슬란드', en: 'Iceland' },
  'LT': { ko: '리투아니아', en: 'Lithuania' },
  'LV': { ko: '라트비아', en: 'Latvia' },
  'MD': { ko: '몰도바', en: 'Moldova' },
  'ME': { ko: '몬테네그로', en: 'Montenegro' },
  'MK': { ko: '북마케도니아', en: 'North Macedonia' },
  'MT': { ko: '몰타', en: 'Malta' },
  'NO': { ko: '노르웨이', en: 'Norway' },
  'RO': { ko: '루마니아', en: 'Romania' },
  'RS': { ko: '세르비아', en: 'Serbia' },
  'SE': { ko: '스웨덴', en: 'Sweden' },
  'SI': { ko: '슬로베니아', en: 'Slovenia' },
  'SM': { ko: '산마리노', en: 'San Marino' },
  'UA': { ko: '우크라이나', en: 'Ukraine' },
  
  // 아시아
  'AF': { ko: '아프가니스탄', en: 'Afghanistan' },
  'AZ': { ko: '아제르바이잔', en: 'Azerbaijan' },
  'BH': { ko: '바레인', en: 'Bahrain' },
  'BN': { ko: '브루나이', en: 'Brunei' },
  'GE': { ko: '조지아', en: 'Georgia' },
  'IQ': { ko: '이라크', en: 'Iraq' },
  'IR': { ko: '이란', en: 'Iran' },
  'JO': { ko: '요르단', en: 'Jordan' },
  'KG': { ko: '키르기스스탄', en: 'Kyrgyzstan' },
  'KH': { ko: '캄보디아', en: 'Cambodia' },
  'KW': { ko: '쿠웨이트', en: 'Kuwait' },
  'KZ': { ko: '카자흐스탄', en: 'Kazakhstan' },
  'LA': { ko: '라오스', en: 'Laos' },
  'LB': { ko: '레바논', en: 'Lebanon' },
  'LK': { ko: '스리랑카', en: 'Sri Lanka' },
  'MM': { ko: '미얀마', en: 'Myanmar' },
  'MN': { ko: '몽골', en: 'Mongolia' },
  'NP': { ko: '네팔', en: 'Nepal' },
  'OM': { ko: '오만', en: 'Oman' },
  'QA': { ko: '카타르', en: 'Qatar' },
  'SY': { ko: '시리아', en: 'Syria' },
  'TJ': { ko: '타지키스탄', en: 'Tajikistan' },
  'TM': { ko: '투르크메니스탄', en: 'Turkmenistan' },
  'UZ': { ko: '우즈베키스탄', en: 'Uzbekistan' },
  'YE': { ko: '예멘', en: 'Yemen' },
  
  // 아프리카
  'AO': { ko: '앙골라', en: 'Angola' },
  'BW': { ko: '보츠와나', en: 'Botswana' },
  'CD': { ko: '콩고민주공화국', en: 'Democratic Republic of the Congo' },
  'CF': { ko: '중앙아프리카공화국', en: 'Central African Republic' },
  'CG': { ko: '콩고공화국', en: 'Republic of the Congo' },
  'CI': { ko: '코트디부아르', en: 'Ivory Coast' },
  'CM': { ko: '카메룬', en: 'Cameroon' },
  'DZ': { ko: '알제리', en: 'Algeria' },
  'ET': { ko: '에티오피아', en: 'Ethiopia' },
  'GA': { ko: '가봉', en: 'Gabon' },
  'GH': { ko: '가나', en: 'Ghana' },
  'GN': { ko: '기니', en: 'Guinea' },
  'GQ': { ko: '적도기니', en: 'Equatorial Guinea' },
  'GW': { ko: '기니비사우', en: 'Guinea-Bissau' },
  'LR': { ko: '라이베리아', en: 'Liberia' },
  'LY': { ko: '리비아', en: 'Libya' },
  'MA': { ko: '모로코', en: 'Morocco' },
  'MG': { ko: '마다가스카르', en: 'Madagascar' },
  'ML': { ko: '말리', en: 'Mali' },
  'MR': { ko: '모리타니', en: 'Mauritania' },
  'MU': { ko: '모리셔스', en: 'Mauritius' },
  'MW': { ko: '말라위', en: 'Malawi' },
  'MZ': { ko: '모잠비크', en: 'Mozambique' },
  'NA': { ko: '나미비아', en: 'Namibia' },
  'NE': { ko: '니제르', en: 'Niger' },
  'NG': { ko: '나이지리아', en: 'Nigeria' },
  'SC': { ko: '세이셸', en: 'Seychelles' },
  'SD': { ko: '수단', en: 'Sudan' },
  'SL': { ko: '시에라리온', en: 'Sierra Leone' },
  'SN': { ko: '세네갈', en: 'Senegal' },
  'TN': { ko: '튀니지', en: 'Tunisia' },
  'TZ': { ko: '탄자니아', en: 'Tanzania' },
  'ZM': { ko: '잠비아', en: 'Zambia' },
  'ZW': { ko: '짐바브웨', en: 'Zimbabwe' },
  
  // 아메리카
  'AG': { ko: '앤티가 바부다', en: 'Antigua and Barbuda' },
  'BB': { ko: '바베이도스', en: 'Barbados' },
  'BO': { ko: '볼리비아', en: 'Bolivia' },
  'BS': { ko: '바하마', en: 'Bahamas' },
  'CR': { ko: '코스타리카', en: 'Costa Rica' },
  'CU': { ko: '쿠바', en: 'Cuba' },
  'DM': { ko: '도미니카', en: 'Dominica' },
  'DO': { ko: '도미니카공화국', en: 'Dominican Republic' },
  'EC': { ko: '에콰도르', en: 'Ecuador' },
  'GD': { ko: '그레나다', en: 'Grenada' },
  'GT': { ko: '과테말라', en: 'Guatemala' },
  'GY': { ko: '가이아나', en: 'Guyana' },
  'HN': { ko: '온두라스', en: 'Honduras' },
  'HT': { ko: '아이티', en: 'Haiti' },
  'JM': { ko: '자메이카', en: 'Jamaica' },
  'KN': { ko: '세인트키츠 네비스', en: 'Saint Kitts and Nevis' },
  'LC': { ko: '세인트루시아', en: 'Saint Lucia' },
  'NI': { ko: '니카라과', en: 'Nicaragua' },
  'PA': { ko: '파나마', en: 'Panama' },
  'PY': { ko: '파라과이', en: 'Paraguay' },
  'SR': { ko: '수리남', en: 'Suriname' },
  'SV': { ko: '엘살바도르', en: 'El Salvador' },
  'UY': { ko: '우루과이', en: 'Uruguay' },
  'VE': { ko: '베네수엘라', en: 'Venezuela' },
  
  // 오세아니아
  'FJ': { ko: '피지', en: 'Fiji' },
  'KI': { ko: '키리바시', en: 'Kiribati' },
  'MH': { ko: '마셜제도', en: 'Marshall Islands' },
  'PG': { ko: '파푸아뉴기니', en: 'Papua New Guinea' },
  'PW': { ko: '팔라우', en: 'Palau' },
  'SB': { ko: '솔로몬제도', en: 'Solomon Islands' },
  'TO': { ko: '통가', en: 'Tonga' },
  'TV': { ko: '투발루', en: 'Tuvalu' },
  'VU': { ko: '바누아투', en: 'Vanuatu' },
  'WS': { ko: '사모아', en: 'Samoa' },
  
  // 속령 및 특별 지역
  'AS': { ko: '아메리칸사모아', en: 'American Samoa' },
  'FK': { ko: '포클랜드제도', en: 'Falkland Islands' },
  'GF': { ko: '프랑스령 기아나', en: 'French Guiana' },
  'GL': { ko: '그린란드', en: 'Greenland' },
  'GU': { ko: '괌', en: 'Guam' },
  'MQ': { ko: '마르티니크', en: 'Martinique' },
  'NC': { ko: '뉴칼레도니아', en: 'New Caledonia' },
  'PF': { ko: '프랑스령 폴리네시아', en: 'French Polynesia' },
  'PR': { ko: '푸에르토리코', en: 'Puerto Rico' },
  'SH': { ko: '세인트헬레나', en: 'Saint Helena' },
  'SJ': { ko: '스발바르제도', en: 'Svalbard' },

};

const cityTranslations = {
    // 한국 주요 도시
    '서울': { en: 'Seoul', countryCode: 'KR' },
    '부산': { en: 'Busan', countryCode: 'KR' },
    '인천': { en: 'Incheon', countryCode: 'KR' },
    '대구': { en: 'Daegu', countryCode: 'KR' },
    '제주': { en: 'Jeju', countryCode: 'KR' },
    '광주': { en: 'Gwangju', countryCode: 'KR' },
    '대전': { en: 'Daejeon', countryCode: 'KR' },
    '울산': { en: 'Ulsan', countryCode: 'KR' },
    '수원': { en: 'Suwon', countryCode: 'KR' },
    '청주': { en: 'Cheongju', countryCode: 'KR' },
    '강릉': { en: 'Gangneung', countryCode: 'KR' },
    '전주': { en: 'Jeonju', countryCode: 'KR' },
    '목포': { en: 'Mokpo', countryCode: 'KR' },
    '포항': { en: 'Pohang', countryCode: 'KR' },
    '창원': { en: 'Changwon', countryCode: 'KR' },
    '안양': { en: 'Anyang', countryCode: 'KR' },
    '성남': { en: 'Seongnam', countryCode: 'KR' },
    '고양': { en: 'Goyang', countryCode: 'KR' },
    '용인': { en: 'Yongin', countryCode: 'KR' },
    '남양주': { en: 'Namyangju', countryCode: 'KR' },
    '김포': { en: 'Gimpo', countryCode: 'KR' },
    '양주': { en: 'Yangju', countryCode: 'KR' },
    '구미': { en: 'Gumi', countryCode: 'KR' },
    '여수': { en: 'Yeosu', countryCode: 'KR' },
    '순천': { en: 'Suncheon', countryCode: 'KR' },
    '광명': { en: 'Gwangmyeong', countryCode: 'KR' },
    '파주': { en: 'Paju', countryCode: 'KR' },
    '안산': { en: 'Ansan', countryCode: 'KR' },
    '이천': { en: 'Icheon', countryCode: 'KR' },
    '화성': { en: 'Hwaseong', countryCode: 'KR' },
    '군산': { en: 'Gunsan', countryCode: 'KR' },
    '포천': { en: 'Pocheon', countryCode: 'KR' },
    '양산': { en: 'Yangsan', countryCode: 'KR' },
    '김해': { en: 'Gimhae', countryCode: 'KR' },
    '진주': { en: 'Jinju', countryCode: 'KR' },
    '세종': { en: 'Sejong', countryCode: 'KR' },
    '제천': { en: 'Jecheon', countryCode: 'KR' },
    '속초': { en: 'Sokcho', countryCode: 'KR' },
    '원주': { en: 'Wonju', countryCode: 'KR' },
    '상주': { en: 'Sangju', countryCode: 'KR' },
    
    // 일본 주요 도시
    '도쿄': { en: 'Tokyo', countryCode: 'JP' },
    '오사카': { en: 'Osaka', countryCode: 'JP' },
    '교토': { en: 'Kyoto', countryCode: 'JP' },
    '삿포로': { en: 'Sapporo', countryCode: 'JP' },
    '나고야': { en: 'Nagoya', countryCode: 'JP' },
    '요코하마': { en: 'Yokohama', countryCode: 'JP' },
    '히로시마': { en: 'Hiroshima', countryCode: 'JP' },
    '후쿠오카': { en: 'Fukuoka', countryCode: 'JP' },
    '나라': { en: 'Nara', countryCode: 'JP' },
    '오키나와': { en: 'Okinawa', countryCode: 'JP' },
    '고베': { en: 'Kobe', countryCode: 'JP' },
    '센다이': { en: 'Sendai', countryCode: 'JP' },
    '가나자와': { en: 'Kanazawa', countryCode: 'JP' },
    '마츠모토': { en: 'Matsumoto', countryCode: 'JP' },
    '가고시마': { en: 'Kagoshima', countryCode: 'JP' },
    '후쿠시마': { en: 'Fukushima', countryCode: 'JP' },
    '나가사키': { en: 'Nagasaki', countryCode: 'JP' },
    '오타루': { en: 'Otaru', countryCode: 'JP' },
    '우에노': { en: 'Ueno', countryCode: 'JP' },
    '하코다테': { en: 'Hakodate', countryCode: 'JP' },
    '마이즈루': { en: 'Maizuru', countryCode: 'JP' },
    '구마모토': { en: 'Kumamoto', countryCode: 'JP' },
    '미야자키': { en: 'Miyazaki', countryCode: 'JP' },
  
    // 유럽 주요 도시
    '파리': { en: 'Paris', countryCode: 'FR' },
    '런던': { en: 'London', countryCode: 'GB' },
    '로마': { en: 'Rome', countryCode: 'IT' },
    '마드리드': { en: 'Madrid', countryCode: 'ES' },
    '바르셀로나': { en: 'Barcelona', countryCode: 'ES' },
    '베를린': { en: 'Berlin', countryCode: 'DE' },
    '암스테르담': { en: 'Amsterdam', countryCode: 'NL' },
    '프라하': { en: 'Prague', countryCode: 'CZ' },
    '비엔나': { en: 'Vienna', countryCode: 'AT' },
    '부다페스트': { en: 'Budapest', countryCode: 'HU' },
    '이스탄불': { en: 'Istanbul', countryCode: 'TR' },
    '아테네': { en: 'Athens', countryCode: 'GR' },
    '베니스': { en: 'Venice', countryCode: 'IT' },
    '취리히': { en: 'Zurich', countryCode: 'CH' },
    '코펜하겐': { en: 'Copenhagen', countryCode: 'DK' },
    '스톡홀름': { en: 'Stockholm', countryCode: 'SE' },
    '오슬로': { en: 'Oslo', countryCode: 'NO' },
    '헬싱키': { en: 'Helsinki', countryCode: 'FI' },
    '리마': { en: 'Lima', countryCode: 'PE' },
    '부에노스아이레스': { en: 'Buenos Aires', countryCode: 'AR' },
    '산티아고': { en: 'Santiago', countryCode: 'CL' },
    '카라카스': { en: 'Caracas', countryCode: 'VE' },
    '보고타': { en: 'Bogota', countryCode: 'CO' },
    '모스크바': { en: 'Moscow', countryCode: 'RU' },
    '키예프': { en: 'Kyiv', countryCode: 'UA' },
    '민스크': { en: 'Minsk', countryCode: 'BY' },
    '타슈켄트': { en: 'Tashkent', countryCode: 'UZ' },
    '알마티': { en: 'Almaty', countryCode: 'KZ' },
    '아스타나': { en: 'Astana', countryCode: 'KZ' },
    '테헤란': { en: 'Tehran', countryCode: 'IR' },
    '두샨베': { en: 'Dushanbe', countryCode: 'TJ' },
    '타지키스탄': { en: 'Tajikistan', countryCode: 'TJ' },
    '아제르바이잔': { en: 'Azerbaijan', countryCode: 'AZ' },
    '예레반': { en: 'Yerevan', countryCode: 'AM' },
    '트빌리시': { en: 'Tbilisi', countryCode: 'GE' },
    
    // 미국/캐나다 주요 도시
    '뉴욕': { en: 'New York', countryCode: 'US' },
    '로스앤젤레스': { en: 'Los Angeles', countryCode: 'US' },
    '샌프란시스코': { en: 'San Francisco', countryCode: 'US' },
    '시카고': { en: 'Chicago', countryCode: 'US' },
    '라스베가스': { en: 'Las Vegas', countryCode: 'US' },
    '마이애미': { en: 'Miami', countryCode: 'US' },
    '워싱턴': { en: 'Washington', countryCode: 'US' },
    '보스턴': { en: 'Boston', countryCode: 'US' },
    '토론토': { en: 'Toronto', countryCode: 'CA' },
    '밴쿠버': { en: 'Vancouver', countryCode: 'CA' },
    '몬트리올': { en: 'Montreal', countryCode: 'CA' },
    
    // 아시아 주요 도시
    '방콕': { en: 'Bangkok', countryCode: 'TH' },
    '싱가포르': { en: 'Singapore', countryCode: 'SG' },
    '베이징': { en: 'Beijing', countryCode: 'CN' },
    '상하이': { en: 'Shanghai', countryCode: 'CN' },
    '홍콩': { en: 'Hong Kong', countryCode: 'HK' },
    '타이페이': { en: 'Taipei', countryCode: 'TW' },
    '하노이': { en: 'Hanoi', countryCode: 'VN' },
    '호치민': { en: 'Ho Chi Minh City', countryCode: 'VN' },
    '쿠알라룸푸르': { en: 'Kuala Lumpur', countryCode: 'MY' },
    '자카르타': { en: 'Jakarta', countryCode: 'ID' },
    '마닐라': { en: 'Manila', countryCode: 'PH' },
    '뭄바이': { en: 'Mumbai', countryCode: 'IN' },
    '델리': { en: 'Delhi', countryCode: 'IN' },
    '두바이': { en: 'Dubai', countryCode: 'AE' },
    '카불': { en: 'Kabul', countryCode: 'AF' },
    
    // 오세아니아 주요 도시
    '시드니': { en: 'Sydney', countryCode: 'AU' },
    '멜버른': { en: 'Melbourne', countryCode: 'AU' },
    '브리즈번': { en: 'Brisbane', countryCode: 'AU' },
    '오클랜드': { en: 'Auckland', countryCode: 'NZ' },
    '웰링턴': { en: 'Wellington', countryCode: 'NZ' },
    '퍼스': { en: 'Perth', countryCode: 'AU' },
    '애들레이드': { en: 'Adelaide', countryCode: 'AU' },
    '타스마니아': { en: 'Tasmania', countryCode: 'AU' },
    
    // 아프리카 주요 도시
    '케이프타운': { en: 'Cape Town', countryCode: 'ZA' },
    '요하네스버그': { en: 'Johannesburg', countryCode: 'ZA' },
    '나이로비': { en: 'Nairobi', countryCode: 'KE' },
    
    // 추가할 수 있는 도시들
    '청두': { en: 'Chengdu', countryCode: 'CN' },
    '광저우': { en: 'Guangzhou', countryCode: 'CN' },
    '하얼빈': { en: 'Harbin', countryCode: 'CN' },
    '시안': { en: 'Xi\'an', countryCode: 'CN' },
    '다낭': { en: 'Da Nang', countryCode: 'VN' },
    '치앙마이': { en: 'Chiang Mai', countryCode: 'TH' },
    '푸켓': { en: 'Phuket', countryCode: 'TH' },
    '발리': { en: 'Bali', countryCode: 'ID' },
    '콜롬보': { en: 'Colombo', countryCode: 'LK' },
    '카트만두': { en: 'Kathmandu', countryCode: 'NP' },
    '아부다비': { en: 'Abu Dhabi', countryCode: 'AE' },
    '도하': { en: 'Doha', countryCode: 'QA' },
    '리야드': { en: 'Riyadh', countryCode: 'SA' },
    '시애틀': { en: 'Seattle', countryCode: 'US' },
    '샌디에고': { en: 'San Diego', countryCode: 'US' },
    '덴버': { en: 'Denver', countryCode: 'US' },
    '오스틴': { en: 'Austin', countryCode: 'US' },
    '오타와': { en: 'Ottawa', countryCode: 'CA' },
    '리스본': { en: 'Lisbon', countryCode: 'PT' },
    '더블린': { en: 'Dublin', countryCode: 'IE' },
    '브뤼셀': { en: 'Brussels', countryCode: 'BE' },
    '뮌헨': { en: 'Munich', countryCode: 'DE' },
    '프랑크푸르트': { en: 'Frankfurt', countryCode: 'DE' },
    '밀라노': { en: 'Milan', countryCode: 'IT' },
    '나폴리': { en: 'Naples', countryCode: 'IT' },
    '세비야': { en: 'Seville', countryCode: 'ES' },
    '마르세유': { en: 'Marseille', countryCode: 'FR' },
    '아덴': { en: 'Aden', countryCode: 'YE' },
    '애버딘': { en: 'Aberdeen', countryCode: 'GB' },
    '바르샤바': { en: 'Warsaw', countryCode: 'PL' },
    '부쿠레슈티': { en: 'Bucharest', countryCode: 'RO' },
    '소피아': { en: 'Sofia', countryCode: 'BG' },
    '카이로': { en: 'Cairo', countryCode: 'EG' },
    '라고스': { en: 'Lagos', countryCode: 'NG' },
    '카사블랑카': { en: 'Casablanca', countryCode: 'MA' },
    '골드코스트': { en: 'Gold Coast', countryCode: 'AU' },
    '크라이스트처치': { en: 'Christchurch', countryCode: 'NZ' },
    '리우데자네이루': { en: 'Rio de Janeiro', countryCode: 'BR' },
    '상파울루': { en: 'São Paulo', countryCode: 'BR' },
    '멕시코시티': { en: 'Mexico City', countryCode: 'MX' },
    '칸쿤': { en: 'Cancun', countryCode: 'MX' },
    '아바나': { en: 'Havana', countryCode: 'CU' },
    '암만': { en: 'Amman', countryCode: 'JO' },
    '베이루트': { en: 'Beirut', countryCode: 'LB' },

    '루체른': { en: 'Lucerne', countryCode: 'CH' },
    '제네바': { en: 'Geneva', countryCode: 'CH' },
    '인터라켄': { en: 'Interlaken', countryCode: 'CH' },
    '로잔': { en: 'Lausanne', countryCode: 'CH' },
    '바젤': { en: 'Basel', countryCode: 'CH' },

    // === 유럽 ===
    // 영국
    '맨체스터': { en: 'Manchester', countryCode: 'GB' },
    '에든버러': { en: 'Edinburgh', countryCode: 'GB' },
    '글래스고': { en: 'Glasgow', countryCode: 'GB' },
    '리버풀': { en: 'Liverpool', countryCode: 'GB' },
    '버밍엄': { en: 'Birmingham', countryCode: 'GB' },
    '리즈': { en: 'Leeds', countryCode: 'GB' },
    '브리스톨': { en: 'Bristol', countryCode: 'GB' },
    
    // 프랑스
    '니스': { en: 'Nice', countryCode: 'FR' },
    '리옹': { en: 'Lyon', countryCode: 'FR' },
    '툴루즈': { en: 'Toulouse', countryCode: 'FR' },
    '보르도': { en: 'Bordeaux', countryCode: 'FR' },
    '스트라스부르': { en: 'Strasbourg', countryCode: 'FR' },
    '칸': { en: 'Cannes', countryCode: 'FR' },
    '아비뇽': { en: 'Avignon', countryCode: 'FR' },
    
    // 독일
    '함부르크': { en: 'Hamburg', countryCode: 'DE' },
    '쾰른': { en: 'Cologne', countryCode: 'DE' },
    '드레스덴': { en: 'Dresden', countryCode: 'DE' },
    '뒤셀도르프': { en: 'Düsseldorf', countryCode: 'DE' },
    '슈투트가르트': { en: 'Stuttgart', countryCode: 'DE' },
    '하노버': { en: 'Hanover', countryCode: 'DE' },
    '라이프치히': { en: 'Leipzig', countryCode: 'DE' },
    
    // 이탈리아
    '피렌체': { en: 'Florence', countryCode: 'IT' },
    '볼로냐': { en: 'Bologna', countryCode: 'IT' },
    '제노바': { en: 'Genoa', countryCode: 'IT' },
    '토리노': { en: 'Turin', countryCode: 'IT' },
    '팔레르모': { en: 'Palermo', countryCode: 'IT' },
    '카타니아': { en: 'Catania', countryCode: 'IT' },
    '바리': { en: 'Bari', countryCode: 'IT' },
    
    // 스페인
    '발렌시아': { en: 'Valencia', countryCode: 'ES' },
    '그라나다': { en: 'Granada', countryCode: 'ES' },
    '말라가': { en: 'Málaga', countryCode: 'ES' },
    '빌바오': { en: 'Bilbao', countryCode: 'ES' },
    '사라고사': { en: 'Zaragoza', countryCode: 'ES' },
    '코르도바(아르헨티나)': { en: 'Córdoba', countryCode: 'AR' },
    
    // 포르투갈
    '포르투': { en: 'Porto', countryCode: 'PT' },
    '파루': { en: 'Faro', countryCode: 'PT' },
    '브라가': { en: 'Braga', countryCode: 'PT' },
    
    // 네덜란드
    '로테르담': { en: 'Rotterdam', countryCode: 'NL' },
    '헤이그': { en: 'The Hague', countryCode: 'NL' },
    '유트레흐트': { en: 'Utrecht', countryCode: 'NL' },
    '아인트호벤': { en: 'Eindhoven', countryCode: 'NL' },
    
    // 벨기에
    '앤트워프': { en: 'Antwerp', countryCode: 'BE' },
    '겐트': { en: 'Ghent', countryCode: 'BE' },
    '브뤼헤': { en: 'Bruges', countryCode: 'BE' },
    
    // 스위스
    '베른': { en: 'Bern', countryCode: 'CH' },
    '그린델발트': { en: 'Grindelwald', countryCode: 'CH' },
    
    // 오스트리아
    '잘츠부르크': { en: 'Salzburg', countryCode: 'AT' },
    '인스브루크': { en: 'Innsbruck', countryCode: 'AT' },
    '그라츠': { en: 'Graz', countryCode: 'AT' },
    
    // 체코
    '브르노': { en: 'Brno', countryCode: 'CZ' },
    '체스키크루믈로프': { en: 'Český Krumlov', countryCode: 'CZ' },
    
    // 폴란드
    '크라쿠프': { en: 'Krakow', countryCode: 'PL' },
    '그단스크': { en: 'Gdansk', countryCode: 'PL' },
    '브로츠와프': { en: 'Wrocław', countryCode: 'PL' },
    
    // 헝가리
    '데브레첸': { en: 'Debrecen', countryCode: 'HU' },
    
    // 그리스
    '테살로니키': { en: 'Thessaloniki', countryCode: 'GR' },
    '산토리니': { en: 'Santorini', countryCode: 'GR' },
    '미코노스': { en: 'Mykonos', countryCode: 'GR' },
    '크레타': { en: 'Crete', countryCode: 'GR' },
    
    // 터키
    '앙카라': { en: 'Ankara', countryCode: 'TR' },
    '안탈리아': { en: 'Antalya', countryCode: 'TR' },
    '카파도키아': { en: 'Cappadocia', countryCode: 'TR' },
    '이즈미르': { en: 'Izmir', countryCode: 'TR' },
    
    // 러시아
    '상트페테르부르크': { en: 'Saint Petersburg', countryCode: 'RU' },
    '블라디보스토크': { en: 'Vladivostok', countryCode: 'RU' },
    '노보시비르스크': { en: 'Novosibirsk', countryCode: 'RU' },
    '소치': { en: 'Sochi', countryCode: 'RU' },
    
    // 스칸디나비아
    '베르겐': { en: 'Bergen', countryCode: 'NO' },
    '트롬쇠': { en: 'Tromsø', countryCode: 'NO' },
    '스타방에르': { en: 'Stavanger', countryCode: 'NO' },
    '예테보리': { en: 'Gothenburg', countryCode: 'SE' },
    '말뫼': { en: 'Malmö', countryCode: 'SE' },
    '웁살라': { en: 'Uppsala', countryCode: 'SE' },
    '탐페레': { en: 'Tampere', countryCode: 'FI' },
    '투르쿠': { en: 'Turku', countryCode: 'FI' },
    '아르후스': { en: 'Aarhus', countryCode: 'DK' },
    '오덴세': { en: 'Odense', countryCode: 'DK' },
    
    // 아일랜드
    '코크': { en: 'Cork', countryCode: 'IE' },
    '골웨이': { en: 'Galway', countryCode: 'IE' },
    
    // 발틱 3국
    '탈린': { en: 'Tallinn', countryCode: 'EE' },
    '리가': { en: 'Riga', countryCode: 'LV' },
    '빌뉴스': { en: 'Vilnius', countryCode: 'LT' },
    
    // 발칸반도
    '베오그라드': { en: 'Belgrade', countryCode: 'RS' },
    '자그레브': { en: 'Zagreb', countryCode: 'HR' },
    '류블랴나': { en: 'Ljubljana', countryCode: 'SI' },
    '사라예보': { en: 'Sarajevo', countryCode: 'BA' },
    '스코페': { en: 'Skopje', countryCode: 'MK' },
    '포드고리차': { en: 'Podgorica', countryCode: 'ME' },
    '티라나': { en: 'Tirana', countryCode: 'AL' },
    
    // === 북미 ===
    // 미국
    '휴스턴': { en: 'Houston', countryCode: 'US' },
    '피닉스': { en: 'Phoenix', countryCode: 'US' },
    '필라델피아': { en: 'Philadelphia', countryCode: 'US' },
    '산안토니오': { en: 'San Antonio', countryCode: 'US' },
    '달라스': { en: 'Dallas', countryCode: 'US' },
    '인디애나폴리스': { en: 'Indianapolis', countryCode: 'US' },
    '콜럼버스': { en: 'Columbus', countryCode: 'US' },
    '샬럿': { en: 'Charlotte', countryCode: 'US' },
    '디트로이트': { en: 'Detroit', countryCode: 'US' },
    '밀워키': { en: 'Milwaukee', countryCode: 'US' },
    '포틀랜드': { en: 'Portland', countryCode: 'US' },
    '오클라호마시티': { en: 'Oklahoma City', countryCode: 'US' },
    '솔트레이크시티': { en: 'Salt Lake City', countryCode: 'US' },
    '캔자스시티': { en: 'Kansas City', countryCode: 'US' },
    '애틀랜타': { en: 'Atlanta', countryCode: 'US' },
    '뉴올리언스': { en: 'New Orleans', countryCode: 'US' },
    '내슈빌': { en: 'Nashville', countryCode: 'US' },
    '미니애폴리스': { en: 'Minneapolis', countryCode: 'US' },
    '피츠버그': { en: 'Pittsburgh', countryCode: 'US' },
    '신시내티': { en: 'Cincinnati', countryCode: 'US' },
    '올랜도': { en: 'Orlando', countryCode: 'US' },
    '탬파': { en: 'Tampa', countryCode: 'US' },
    '호놀룰루': { en: 'Honolulu', countryCode: 'US' },
    '앵커리지': { en: 'Anchorage', countryCode: 'US' },
    
    // 캐나다
    '캘거리': { en: 'Calgary', countryCode: 'CA' },
    '에드먼턴': { en: 'Edmonton', countryCode: 'CA' },
    '위니펙': { en: 'Winnipeg', countryCode: 'CA' },
    '퀘벡시티': { en: 'Quebec City', countryCode: 'CA' },
    '해밀턴': { en: 'Hamilton', countryCode: 'CA' },
    '빅토리아(캐나다)': { en: 'Victoria', countryCode: 'CA' },
    
    // === 아시아 ===
    // 중국
    '심천': { en: 'Shenzhen', countryCode: 'CN' },
    '난징': { en: 'Nanjing', countryCode: 'CN' },
    '항저우': { en: 'Hangzhou', countryCode: 'CN' },
    '쑤저우': { en: 'Suzhou', countryCode: 'CN' },
    '칭다오': { en: 'Qingdao', countryCode: 'CN' },
    '다롄': { en: 'Dalian', countryCode: 'CN' },
    '샤먼': { en: 'Xiamen', countryCode: 'CN' },
    '톈진': { en: 'Tianjin', countryCode: 'CN' },
    '우한': { en: 'Wuhan', countryCode: 'CN' },
    '충칭': { en: 'Chongqing', countryCode: 'CN' },
    '선전': { en: 'Shenzhen', countryCode: 'CN' },
    '장자제': { en: 'Zhangjiajie', countryCode: 'CN' },
    '계림': { en: 'Guilin', countryCode: 'CN' },
    '쿤밍': { en: 'Kunming', countryCode: 'CN' },
    '란저우': { en: 'Lanzhou', countryCode: 'CN' },
    '우루무치': { en: 'Urumqi', countryCode: 'CN' },
    
    // 일본
    '니가타': { en: 'Niigata', countryCode: 'JP' },
    '시즈오카': { en: 'Shizuoka', countryCode: 'JP' },
    '하마마츠': { en: 'Hamamatsu', countryCode: 'JP' },
    '가와사키': { en: 'Kawasaki', countryCode: 'JP' },
    '나가노': { en: 'Nagano', countryCode: 'JP' },
    '오카야마': { en: 'Okayama', countryCode: 'JP' },
    '타카마츠': { en: 'Takamatsu', countryCode: 'JP' },
    '마츠야마': { en: 'Matsuyama', countryCode: 'JP' },
    '토야마': { en: 'Toyama', countryCode: 'JP' },
    '아키타': { en: 'Akita', countryCode: 'JP' },
    '야마가타': { en: 'Yamagata', countryCode: 'JP' },
    
    // 인도
    '뉴델리': { en: 'New Delhi', countryCode: 'IN' },
    '콜카타': { en: 'Kolkata', countryCode: 'IN' },
    '첸나이': { en: 'Chennai', countryCode: 'IN' },
    '방갈로르': { en: 'Bangalore', countryCode: 'IN' },
    '하이데라바드': { en: 'Hyderabad', countryCode: 'IN' },
    '아마다바드': { en: 'Ahmedabad', countryCode: 'IN' },
    '푸네': { en: 'Pune', countryCode: 'IN' },
    '자이푸르': { en: 'Jaipur', countryCode: 'IN' },
    '아그라': { en: 'Agra', countryCode: 'IN' },
    '바라나시': { en: 'Varanasi', countryCode: 'IN' },
    '고아': { en: 'Goa', countryCode: 'IN' },
    '우다이푸르': { en: 'Udaipur', countryCode: 'IN' },
    
    // 동남아시아
    '양곤': { en: 'Yangon', countryCode: 'MM' },
    '만달레이': { en: 'Mandalay', countryCode: 'MM' },
    '네피도': { en: 'Naypyidaw', countryCode: 'MM' },
    '비엔티안': { en: 'Vientiane', countryCode: 'LA' },
    '루앙프라방': { en: 'Luang Prabang', countryCode: 'LA' },
    '프놈펜': { en: 'Phnom Penh', countryCode: 'KH' },
    '시엠레아프': { en: 'Siem Reap', countryCode: 'KH' },
    '세부': { en: 'Cebu', countryCode: 'PH' },
    '다바오': { en: 'Davao', countryCode: 'PH' },
    '보라카이': { en: 'Boracay', countryCode: 'PH' },
    '팔라완': { en: 'Palawan', countryCode: 'PH' },
    '페낭': { en: 'Penang', countryCode: 'MY' },
    '코타키나발루': { en: 'Kota Kinabalu', countryCode: 'MY' },
    '이포': { en: 'Ipoh', countryCode: 'MY' },
    '수라바야': { en: 'Surabaya', countryCode: 'ID' },
    '반둥': { en: 'Bandung', countryCode: 'ID' },
    '족자카르타': { en: 'Yogyakarta', countryCode: 'ID' },
    '롬복': { en: 'Lombok', countryCode: 'ID' },
    '브루나이': { en: 'Bandar Seri Begawan', countryCode: 'BN' },
    
    // 중앙아시아
    '비슈케크': { en: 'Bishkek', countryCode: 'KG' },
    '오시': { en: 'Osh', countryCode: 'KG' },
    '사마르칸트': { en: 'Samarkand', countryCode: 'UZ' },
    '부하라': { en: 'Bukhara', countryCode: 'UZ' },
    '아시가바트': { en: 'Ashgabat', countryCode: 'TM' },
    
    // 중동
    '예루살렘': { en: 'Jerusalem', countryCode: 'IL' },
    '텔아비브': { en: 'Tel Aviv', countryCode: 'IL' },
    '하이파': { en: 'Haifa', countryCode: 'IL' },
    '메카': { en: 'Mecca', countryCode: 'SA' },
    '메디나': { en: 'Medina', countryCode: 'SA' },
    '제다': { en: 'Jeddah', countryCode: 'SA' },
    '담맘': { en: 'Dammam', countryCode: 'SA' },
    '쿠웨이트시티': { en: 'Kuwait City', countryCode: 'KW' },
    '마나마': { en: 'Manama', countryCode: 'BH' },
    '마스카트': { en: 'Muscat', countryCode: 'OM' },
    '살라라': { en: 'Salalah', countryCode: 'OM' },
    '다마스쿠스': { en: 'Damascus', countryCode: 'SY' },
    '알레포': { en: 'Aleppo', countryCode: 'SY' },
    '바그다드': { en: 'Baghdad', countryCode: 'IQ' },
    '바스라': { en: 'Basra', countryCode: 'IQ' },
    '에르빌': { en: 'Erbil', countryCode: 'IQ' },
    '이스파한': { en: 'Isfahan', countryCode: 'IR' },
    '시라즈': { en: 'Shiraz', countryCode: 'IR' },
    '마슈하드': { en: 'Mashhad', countryCode: 'IR' },
    '사나': { en: 'Sana\'a', countryCode: 'YE' },
    
    // === 아프리카 ===
    '마라케시': { en: 'Marrakesh', countryCode: 'MA' },
    '라바트': { en: 'Rabat', countryCode: 'MA' },
    '탕헤르': { en: 'Tangier', countryCode: 'MA' },
    '페스': { en: 'Fes', countryCode: 'MA' },
    '알제': { en: 'Algiers', countryCode: 'DZ' },
    '오란': { en: 'Oran', countryCode: 'DZ' },
    '튀니스': { en: 'Tunis', countryCode: 'TN' },
    '트리폴리': { en: 'Tripoli', countryCode: 'LY' },
    '알렉산드리아': { en: 'Alexandria', countryCode: 'EG' },
    '룩소르': { en: 'Luxor', countryCode: 'EG' },
    '아스완': { en: 'Aswan', countryCode: 'EG' },
    '하르툼': { en: 'Khartoum', countryCode: 'SD' },
    '아디스아바바': { en: 'Addis Ababa', countryCode: 'ET' },
    '다르에스살람': { en: 'Dar es Salaam', countryCode: 'TZ' },
    '아루샤': { en: 'Arusha', countryCode: 'TZ' },
    '잔지바르': { en: 'Zanzibar', countryCode: 'TZ' },
    '킬리만자로': { en: 'Kilimanjaro', countryCode: 'TZ' },
    '몸바사': { en: 'Mombasa', countryCode: 'KE' },
    '맘푸토': { en: 'Maputo', countryCode: 'MZ' },
    '하라레': { en: 'Harare', countryCode: 'ZW' },
    '루사카': { en: 'Lusaka', countryCode: 'ZM' },
    '릴롱웨': { en: 'Lilongwe', countryCode: 'MW' },
    '가보로네': { en: 'Gaborone', countryCode: 'BW' },
    '빈트후크': { en: 'Windhoek', countryCode: 'NA' },
    '더반': { en: 'Durban', countryCode: 'ZA' },
    '포트엘리자베스': { en: 'Port Elizabeth', countryCode: 'ZA' },
    '프리토리아': { en: 'Pretoria', countryCode: 'ZA' },
    '블룸폰텐': { en: 'Bloemfontein', countryCode: 'ZA' },
    '아크라': { en: 'Accra', countryCode: 'GH' },
    '아부자': { en: 'Abuja', countryCode: 'NG' },
    '킨샤사': { en: 'Kinshasa', countryCode: 'CD' },
    '브라자빌': { en: 'Brazzaville', countryCode: 'CG' },
    '두알라': { en: 'Douala', countryCode: 'CM' },
    '야운데': { en: 'Yaoundé', countryCode: 'CM' },
    '방기': { en: 'Bangui', countryCode: 'CF' },
    '리브르빌': { en: 'Libreville', countryCode: 'GA' },
    '말라보': { en: 'Malabo', countryCode: 'GQ' },
    '루안다': { en: 'Luanda', countryCode: 'AO' },
    '아비장': { en: 'Abidjan', countryCode: 'CI' },
    '다카르': { en: 'Dakar', countryCode: 'SN' },
    '바마코': { en: 'Bamako', countryCode: 'ML' },
    '니아메이': { en: 'Niamey', countryCode: 'NE' },
    '누악쇼트': { en: 'Nouakchott', countryCode: 'MR' },
    '몬로비아': { en: 'Monrovia', countryCode: 'LR' },
    '프리타운': { en: 'Freetown', countryCode: 'SL' },
    '코나크리': { en: 'Conakry', countryCode: 'GN' },
    '비사우': { en: 'Bissau', countryCode: 'GW' },
    '안타나나리보': { en: 'Antananarivo', countryCode: 'MG' },
    '포트루이스': { en: 'Port Louis', countryCode: 'MU' },
    '빅토리아(세이셸)': { en: 'Victoria', countryCode: 'SC' },
    
    // === 남미 ===
    '브라질리아': { en: 'Brasília', countryCode: 'BR' },
    '포르투알레그리': { en: 'Porto Alegre', countryCode: 'BR' },
    '벨루오리존치': { en: 'Belo Horizonte', countryCode: 'BR' },
    '레시페': { en: 'Recife', countryCode: 'BR' },
    '살바도르': { en: 'Salvador', countryCode: 'BR' },
    '포르탈레자': { en: 'Fortaleza', countryCode: 'BR' },
    '쿠리치바': { en: 'Curitiba', countryCode: 'BR' },
    '마나우스': { en: 'Manaus', countryCode: 'BR' },
    '벨렘': { en: 'Belém', countryCode: 'BR' },
    '플로리아노폴리스': { en: 'Florianópolis', countryCode: 'BR' },
    '코르도바(스페인)': { en: 'Córdoba', countryCode: 'ES' },
    '로사리오': { en: 'Rosario', countryCode: 'AR' },
    '멘도사': { en: 'Mendoza', countryCode: 'AR' },
    '마르델플라타': { en: 'Mar del Plata', countryCode: 'AR' },
    '푸에르토이과수': { en: 'Puerto Iguazú', countryCode: 'AR' },
    '바릴로체': { en: 'Bariloche', countryCode: 'AR' },
    '우수아이아': { en: 'Ushuaia', countryCode: 'AR' },
    '발파라이소': { en: 'Valparaíso', countryCode: 'CL' },
    '비냐델마르': { en: 'Viña del Mar', countryCode: 'CL' },
    '푸콘': { en: 'Pucón', countryCode: 'CL' },
    '라세레나': { en: 'La Serena', countryCode: 'CL' },
    '몬테비데오': { en: 'Montevideo', countryCode: 'UY' },
    '푼타델에스테': { en: 'Punta del Este', countryCode: 'UY' },
    '아순시온': { en: 'Asunción', countryCode: 'PY' },
    '시우다드델에스테': { en: 'Ciudad del Este', countryCode: 'PY' },
    '라파스': { en: 'La Paz', countryCode: 'BO' },
    '산타크루즈': { en: 'Santa Cruz', countryCode: 'BO' },
    '코차밤바': { en: 'Cochabamba', countryCode: 'BO' },
    '수크레': { en: 'Sucre', countryCode: 'BO' },
    '키토': { en: 'Quito', countryCode: 'EC' },
    '과야킬': { en: 'Guayaquil', countryCode: 'EC' },
    '쿠엥카': { en: 'Cuenca', countryCode: 'EC' },
    '갈라파고스': { en: 'Galapagos', countryCode: 'EC' },
    '메델린': { en: 'Medellín', countryCode: 'CO' },
    '카르타헤나': { en: 'Cartagena', countryCode: 'CO' },
    '칼리': { en: 'Cali', countryCode: 'CO' },
    '바랑키야': { en: 'Barranquilla', countryCode: 'CO' },
    '쿠스코': { en: 'Cusco', countryCode: 'PE' },
    '아레키파': { en: 'Arequipa', countryCode: 'PE' },
    '트루히요': { en: 'Trujillo', countryCode: 'PE' },
    '마라카이보': { en: 'Maracaibo', countryCode: 'VE' },
    '발렌시아': { en: 'Valencia', countryCode: 'VE' },
    '조지타운': { en: 'Georgetown', countryCode: 'GY' },
    '파라마리보': { en: 'Paramaribo', countryCode: 'SR' },
    '카옌': { en: 'Cayenne', countryCode: 'GF' },
    
    // === 중미/카리브해 ===
    '과테말라시티': { en: 'Guatemala City', countryCode: 'GT' },
    '안티구아': { en: 'Antigua', countryCode: 'GT' },
    '산살바도르': { en: 'San Salvador', countryCode: 'SV' },
    '테구시갈파': { en: 'Tegucigalpa', countryCode: 'HN' },
    '산페드로술라': { en: 'San Pedro Sula', countryCode: 'HN' },
    '마나과': { en: 'Managua', countryCode: 'NI' },
    '그라나다': { en: 'Granada', countryCode: 'NI' },
    '산호세': { en: 'San José', countryCode: 'CR' },
    '파나마시티': { en: 'Panama City', countryCode: 'PA' },
    '산후안': { en: 'San Juan', countryCode: 'PR' },
    '산토도밍고': { en: 'Santo Domingo', countryCode: 'DO' },
    '푼타카나': { en: 'Punta Cana', countryCode: 'DO' },
    '킹스턴': { en: 'Kingston', countryCode: 'JM' },
    '몬테고베이': { en: 'Montego Bay', countryCode: 'JM' },
    '나소': { en: 'Nassau', countryCode: 'BS' },
    '브리지타운': { en: 'Bridgetown', countryCode: 'BB' },
    '포르드프랑스': { en: 'Fort-de-France', countryCode: 'MQ' },
    '세인트조지스': { en: 'St. George\'s', countryCode: 'GD' },
    '로조': { en: 'Roseau', countryCode: 'DM' },
    '캐스트리스': { en: 'Castries', countryCode: 'LC' },
    '바스테르': { en: 'Basseterre', countryCode: 'KN' },
    '세인트존스': { en: "St. John's", countryCode: 'AG' },
    '포르토프랭스': { en: 'Port-au-Prince', countryCode: 'HT' },
    
    // === 태평양 도서국 ===
    '아피아': { en: 'Apia', countryCode: 'WS' },
    '수바': { en: 'Suva', countryCode: 'FJ' },
    '포트빌라': { en: 'Port Vila', countryCode: 'VU' },
    '누메아': { en: 'Nouméa', countryCode: 'NC' },
    '파페에테': { en: 'Papeete', countryCode: 'PF' },
    '호니아라': { en: 'Honiara', countryCode: 'SB' },
    '포트모르즈비': { en: 'Port Moresby', countryCode: 'PG' },
    '마주로': { en: 'Majuro', countryCode: 'MH' },
    '코로르': { en: 'Koror', countryCode: 'PW' },
    '타라와': { en: 'Tarawa', countryCode: 'KI' },
    '푸나푸티': { en: 'Funafuti', countryCode: 'TV' },
    '얄루이트': { en: 'Jaluit', countryCode: 'MH' },
    '파고파고': { en: 'Pago Pago', countryCode: 'AS' },
    '아가냐': { en: 'Hagåtña', countryCode: 'GU' },
    '누쿠알로파': { en: 'Nukuʻalofa', countryCode: 'TO' },
    
    // === 북극/남극 지역 ===
    '레이캬비크': { en: 'Reykjavik', countryCode: 'IS' },
    '아쿠레이리': { en: 'Akureyri', countryCode: 'IS' },
    '토르스하운': { en: 'Tórshavn', countryCode: 'FO' },
    '누크': { en: 'Nuuk', countryCode: 'GL' },
    '롱위에아르비엔': { en: 'Longyearbyen', countryCode: 'SJ' },
    
    // === 기타 특별 지역 ===
    '지브롤터': { en: 'Gibraltar', countryCode: 'GI' },
    '산마리노': { en: 'San Marino', countryCode: 'SM' },
    '안도라라베야': { en: 'Andorra la Vella', countryCode: 'AD' },
    '발레타': { en: 'Valletta', countryCode: 'MT' },
    '니코시아': { en: 'Nicosia', countryCode: 'CY' },
    '파포스': { en: 'Paphos', countryCode: 'CY' },
    '스탠리': { en: 'Stanley', countryCode: 'FK' },
    '헬레나': { en: 'Jamestown', countryCode: 'SH' },
    
    // === 추가 아시아 도시 ===
    '울란바토르': { en: 'Ulaanbaatar', countryCode: 'MN' },
    '티라스폴': { en: 'Tiraspol', countryCode: 'MD' },
    '키시나우': { en: 'Chișinău', countryCode: 'MD' },
    '스테파나케르트': { en: 'Stepanakert', countryCode: 'AZ' },
    '바쿠': { en: 'Baku', countryCode: 'AZ' },
    '바투미': { en: 'Batumi', countryCode: 'GE' },
    '수후미': { en: 'Sukhumi', countryCode: 'GE' },
    
    // === 한국 추가 도시 ===
    '춘천': { en: 'Chuncheon', countryCode: 'KR' },
    '통영': { en: 'Tongyeong', countryCode: 'KR' },
    '경주': { en: 'Gyeongju', countryCode: 'KR' },
    '논산': { en: 'Nonsan', countryCode: 'KR' },
    '천안': { en: 'Cheonan', countryCode: 'KR' },
    '평택': { en: 'Pyeongtaek', countryCode: 'KR' },
    '부천': { en: 'Bucheon', countryCode: 'KR' },
    '공주': { en: 'Gongju', countryCode: 'KR' },
    '부여': { en: 'Buyeo', countryCode: 'KR' },
    '보령': { en: 'Boryeong', countryCode: 'KR' },
    '태안': { en: 'Taean', countryCode: 'KR' },
    '안동': { en: 'Andong', countryCode: 'KR' },
    '경산': { en: 'Gyeongsan', countryCode: 'KR' },
    '문경': { en: 'Mungyeong', countryCode: 'KR' },
    '영주': { en: 'Yeongju', countryCode: 'KR' },
    '봉화': { en: 'Bonghwa', countryCode: 'KR' },
    '울진': { en: 'Uljin', countryCode: 'KR' },
    '영덕': { en: 'Yeongdeok', countryCode: 'KR' },
    '거제': { en: 'Geoje', countryCode: 'KR' },
    '사천': { en: 'Sacheon', countryCode: 'KR' },
    '남해': { en: 'Namhae', countryCode: 'KR' },
    '하동': { en: 'Hadong', countryCode: 'KR' },
    '함양': { en: 'Hamyang', countryCode: 'KR' },
    '거창': { en: 'Geochang', countryCode: 'KR' },
    '정읍': { en: 'Jeongeup', countryCode: 'KR' },
    '남원': { en: 'Namwon', countryCode: 'KR' },
    '김제': { en: 'Gimje', countryCode: 'KR' },
    '완주': { en: 'Wanju', countryCode: 'KR' },
    '익산': { en: 'Iksan', countryCode: 'KR' },
    '무주': { en: 'Muju', countryCode: 'KR' },
    '진안': { en: 'Jinan', countryCode: 'KR' },
    '해남': { en: 'Haenam', countryCode: 'KR' },
    '영암': { en: 'Yeongam', countryCode: 'KR' },
    '무안': { en: 'Muan', countryCode: 'KR' },
    '신안': { en: 'Shinan', countryCode: 'KR' },
    '완도': { en: 'Wando', countryCode: 'KR' },
    '보성': { en: 'Boseong', countryCode: 'KR' },
    '화순': { en: 'Hwasun', countryCode: 'KR' },
    '곡성': { en: 'Gokseong', countryCode: 'KR' },
    '구례': { en: 'Gurye', countryCode: 'KR' },
    '장성': { en: 'Jangseong', countryCode: 'KR' },
    '담양': { en: 'Damyang', countryCode: 'KR' },
    '고흥': { en: 'Goheung', countryCode: 'KR' },
    '장흥': { en: 'Jangheung', countryCode: 'KR' },
    '강진': { en: 'Gangjin', countryCode: 'KR' },
    '진도': { en: 'Jindo', countryCode: 'KR' },
    '광양': { en: 'Gwangyang', countryCode: 'KR' },
    '횡성': { en: 'Hoengseong', countryCode: 'KR' },
    '영월': { en: 'Yeongwol', countryCode: 'KR' },
    '평창': { en: 'Pyeongchang', countryCode: 'KR' },
    '정선': { en: 'Jeongseon', countryCode: 'KR' },
    '양양': { en: 'Yangyang', countryCode: 'KR' },
    '인제': { en: 'Inje', countryCode: 'KR' },
    '고성': { en: 'Goseong', countryCode: 'KR' },
    '화천': { en: 'Hwacheon', countryCode: 'KR' },
    '철원': { en: 'Cheorwon', countryCode: 'KR' },
    '삼척': { en: 'Samcheok', countryCode: 'KR' },
    '동해': { en: 'Donghae', countryCode: 'KR' },
    '태백': { en: 'Taebaek', countryCode: 'KR' },
    '울릉도': { en: 'Ulleungdo', countryCode: 'KR' },
    '독도': { en: 'Dokdo', countryCode: 'KR' },
    '동두천': { en: 'Dongducheon', countryCode: 'KR' },
    '연천': { en: 'Yeoncheon', countryCode: 'KR' },
  };
  
  module.exports = {
    cityTranslations,
    countryMapping
  };