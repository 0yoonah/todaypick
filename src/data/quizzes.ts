import { Quiz } from "@/types/quiz";

/**
 * 정적 문항의 생성 시각.
 * 모듈이 로드될 때마다 값이 달라지지 않도록 고정한다.
 */
const CREATED_AT = "2026-08-06T00:00:00.000Z";

/**
 * 오늘의 퀴즈 문항.
 * 기존 사용자의 `quiz_results.quiz_id`가 계속 유효하도록 id는 재사용하지 않는다.
 */
export const quizzes: Quiz[] = [
  {
    id: "1",
    question: "다음 중 JavaScript에서 변수를 선언하는 방법이 아닌 것은?",
    options: ["var", "let", "const", "variable"],
    correct_answer: 3,
    explanation:
      "JavaScript에서 변수 선언 키워드는 var, let, const입니다. variable은 변수 선언 키워드가 아닙니다.",
    category: "programming",
    created_at: CREATED_AT,
  },
  {
    id: "2",
    question: "HTTP 상태 코드 404의 의미는?",
    options: [
      "서버 오류",
      "권한 없음",
      "페이지를 찾을 수 없음",
      "요청이 성공함",
    ],
    correct_answer: 2,
    explanation:
      'HTTP 404 상태 코드는 "Not Found"를 의미하며, 요청한 리소스를 찾을 수 없을 때 반환됩니다.',
    category: "web",
    created_at: CREATED_AT,
  },
  {
    id: "3",
    question: "다음 중 관계형 데이터베이스의 특징이 아닌 것은?",
    options: [
      "ACID 속성 보장",
      "테이블 구조",
      "NoSQL 문서 기반",
      "SQL 쿼리 사용",
    ],
    correct_answer: 2,
    explanation:
      "NoSQL 문서 기반은 관계형 데이터베이스의 특징이 아닙니다. 관계형 데이터베이스는 테이블 구조를 가지고 ACID 속성을 보장하며 SQL을 사용합니다.",
    category: "database",
    created_at: CREATED_AT,
  },
  {
    id: "4",
    question: "다음 중 가장 안전한 비밀번호 정책은?",
    options: [
      "8자 이상, 대소문자 포함",
      "12자 이상, 대소문자, 숫자, 특수문자 포함",
      "6자 이상, 숫자 포함",
      "10자 이상, 대소문자 포함",
    ],
    correct_answer: 1,
    explanation:
      "12자 이상의 길이에 대소문자, 숫자, 특수문자를 모두 포함하는 비밀번호가 가장 안전합니다. 길이가 길수록 브루트포스 공격에 대한 저항력이 높아집니다.",
    category: "security",
    created_at: CREATED_AT,
  },
  {
    id: "5",
    question: "Docker 컨테이너와 가상머신(VM)의 주요 차이점은?",
    options: [
      "Docker는 더 많은 리소스를 사용함",
      "VM은 호스트 OS를 공유함",
      "Docker는 호스트 OS 커널을 공유함",
      "VM이 더 빠르게 시작됨",
    ],
    correct_answer: 2,
    explanation:
      "Docker 컨테이너는 호스트 OS의 커널을 공유하여 더 가볍고 빠르게 실행됩니다. 반면 VM은 각각 독립적인 OS를 실행합니다.",
    category: "devops",
    created_at: CREATED_AT,
  },
  {
    id: "6",
    question: "다음 중 RESTful API 설계 원칙이 아닌 것은?",
    options: [
      "무상태성(Stateless)",
      "캐시 가능(Cacheable)",
      "계층형 시스템(Layered System)",
      "동기식 처리(Synchronous)",
    ],
    correct_answer: 3,
    explanation:
      "REST의 제약 조건은 무상태성, 캐시 가능, 계층형 시스템, 균일한 인터페이스, 클라이언트-서버 구조 등입니다. 동기식 처리는 REST의 설계 원칙이 아닙니다.",
    category: "web",
    created_at: CREATED_AT,
  },
  {
    id: "7",
    question: "다음 중 Git에서 브랜치를 병합하는 명령어는?",
    options: ["git branch", "git merge", "git checkout", "git clone"],
    correct_answer: 1,
    explanation:
      "git merge 명령어는 브랜치를 병합할 때 사용합니다. git branch는 브랜치 목록을 보거나 생성할 때, git checkout은 브랜치를 전환할 때, git clone은 저장소를 복제할 때 사용합니다.",
    category: "programming",
    created_at: CREATED_AT,
  },
  {
    id: "8",
    question: "다음 중 클라우드 컴퓨팅의 주요 모델이 아닌 것은?",
    options: [
      "IaaS (Infrastructure as a Service)",
      "PaaS (Platform as a Service)",
      "SaaS (Software as a Service)",
      "DaaS (Data as a Service)",
    ],
    correct_answer: 3,
    explanation:
      "클라우드 컴퓨팅의 주요 모델은 IaaS, PaaS, SaaS입니다. DaaS는 일반적인 클라우드 서비스 모델이 아닙니다.",
    category: "cloud",
    created_at: CREATED_AT,
  },
  {
    id: "9",
    question: "다음 중 시간 복잡도가 O(log n)인 알고리즘은?",
    options: ["선형 검색", "이진 검색", "버블 정렬", "선택 정렬"],
    correct_answer: 1,
    explanation:
      "이진 검색은 정렬된 배열에서 중간값을 기준으로 검색 범위를 절반씩 줄여나가므로 시간 복잡도가 O(log n)입니다.",
    category: "algorithm",
    created_at: CREATED_AT,
  },
  {
    id: "10",
    question: "다음 중 HTTPS의 보안 기능이 아닌 것은?",
    options: ["데이터 암호화", "서버 인증", "데이터 무결성", "방화벽 보호"],
    correct_answer: 3,
    explanation:
      "HTTPS는 데이터 암호화, 서버 인증, 데이터 무결성을 제공하지만 방화벽 보호는 제공하지 않습니다. 방화벽은 네트워크 레벨에서의 보안 기능입니다.",
    category: "security",
    created_at: CREATED_AT,
  },
  {
    id: "11",
    question: "Python에서 리스트와 튜플의 가장 큰 차이는?",
    options: [
      "튜플은 생성 후 요소를 변경할 수 없다",
      "리스트는 순서를 보장하지 않는다",
      "튜플은 중복 값을 가질 수 없다",
      "리스트는 반복문에서 사용할 수 없다",
    ],
    correct_answer: 0,
    explanation:
      "튜플은 불변(immutable) 자료형이라 생성 후 요소를 바꿀 수 없습니다. 리스트는 가변(mutable)이며 두 자료형 모두 순서를 유지하고 중복 값을 가질 수 있습니다.",
    category: "programming",
    created_at: CREATED_AT,
  },
  {
    id: "12",
    question: "다음 중 JavaScript의 원시 타입(primitive type)이 아닌 것은?",
    options: ["string", "number", "object", "boolean"],
    correct_answer: 2,
    explanation:
      "JavaScript의 원시 타입은 string, number, boolean, null, undefined, symbol, bigint입니다. object는 참조 타입입니다.",
    category: "programming",
    created_at: CREATED_AT,
  },
  {
    id: "13",
    question: "다음 HTTP 메서드 중 멱등성(idempotent)이 보장되지 않는 것은?",
    options: ["GET", "PUT", "DELETE", "POST"],
    correct_answer: 3,
    explanation:
      "POST는 같은 요청을 여러 번 보내면 리소스가 여러 개 생성될 수 있어 멱등성이 보장되지 않습니다. GET, PUT, DELETE는 여러 번 호출해도 결과 상태가 같습니다.",
    category: "web",
    created_at: CREATED_AT,
  },
  {
    id: "14",
    question: "CORS(Cross-Origin Resource Sharing)가 제어하는 것은?",
    options: [
      "브라우저에서 다른 출처의 리소스에 접근할 수 있는지 여부",
      "서버의 방화벽 규칙",
      "DNS 캐시 유지 시간",
      "TCP 연결 재사용 여부",
    ],
    correct_answer: 0,
    explanation:
      "CORS는 브라우저의 동일 출처 정책을 완화해, 서버가 허용한 출처에서만 리소스를 읽을 수 있도록 제어하는 규약입니다.",
    category: "web",
    created_at: CREATED_AT,
  },
  {
    id: "15",
    question: "테이블에 인덱스를 추가하면 일반적으로 어떤 변화가 생기나요?",
    options: [
      "조회 성능은 좋아지고 쓰기 비용과 저장 공간은 늘어난다",
      "조회와 쓰기 성능이 모두 좋아진다",
      "저장 공간 사용량이 줄어든다",
      "트랜잭션 격리 수준이 자동으로 올라간다",
    ],
    correct_answer: 0,
    explanation:
      "인덱스는 조회 속도를 높이지만 삽입·수정·삭제 시 인덱스도 갱신해야 하므로 쓰기 비용이 늘고 추가 저장 공간을 사용합니다.",
    category: "database",
    created_at: CREATED_AT,
  },
  {
    id: "16",
    question: "다음 트랜잭션 격리 수준 중 가장 엄격한 것은?",
    options: [
      "READ UNCOMMITTED",
      "READ COMMITTED",
      "REPEATABLE READ",
      "SERIALIZABLE",
    ],
    correct_answer: 3,
    explanation:
      "SERIALIZABLE은 트랜잭션을 순차 실행한 것과 같은 결과를 보장하는 가장 엄격한 격리 수준입니다. 대신 동시성은 가장 낮습니다.",
    category: "database",
    created_at: CREATED_AT,
  },
  {
    id: "17",
    question: "외래 키(Foreign Key)의 주된 목적은?",
    options: [
      "테이블 간 참조 무결성을 보장한다",
      "중복된 행을 자동으로 제거한다",
      "쿼리 결과를 캐시한다",
      "인덱스를 자동으로 삭제한다",
    ],
    correct_answer: 0,
    explanation:
      "외래 키는 참조하는 테이블에 존재하지 않는 값이 저장되지 않도록 막아 테이블 간 참조 무결성을 보장합니다.",
    category: "database",
    created_at: CREATED_AT,
  },
  {
    id: "18",
    question: "SQL Injection을 막는 가장 효과적인 방법은?",
    options: [
      "사용자 입력을 문자열로 이어 붙여 쿼리를 만든다",
      "파라미터화된 쿼리(prepared statement)를 사용한다",
      "오류 메시지를 감춘다",
      "HTTPS를 적용한다",
    ],
    correct_answer: 1,
    explanation:
      "파라미터화된 쿼리는 입력값을 데이터로만 처리해 쿼리 구조가 바뀌지 않도록 합니다. 오류 메시지 숨김과 HTTPS는 도움이 되지만 근본 대책은 아닙니다.",
    category: "security",
    created_at: CREATED_AT,
  },
  {
    id: "19",
    question: "XSS(Cross-Site Scripting) 공격이란?",
    options: [
      "악성 스크립트를 웹 페이지에 삽입해 다른 사용자의 브라우저에서 실행시키는 공격",
      "데이터베이스 쿼리를 조작하는 공격",
      "네트워크 패킷을 가로채는 공격",
      "서버 자원을 고갈시키는 공격",
    ],
    correct_answer: 0,
    explanation:
      "XSS는 검증되지 않은 입력이 페이지에 그대로 출력될 때 악성 스크립트가 다른 사용자의 브라우저에서 실행되는 취약점입니다.",
    category: "security",
    created_at: CREATED_AT,
  },
  {
    id: "20",
    question: "클라우드의 오토스케일링(Auto Scaling)이 하는 일은?",
    options: [
      "부하에 따라 인스턴스 수를 자동으로 늘리거나 줄인다",
      "데이터를 자동으로 백업한다",
      "코드를 자동으로 배포한다",
      "오래된 로그를 자동으로 삭제한다",
    ],
    correct_answer: 0,
    explanation:
      "오토스케일링은 트래픽이나 자원 사용량 지표에 따라 인스턴스 수를 자동 조절해 성능과 비용의 균형을 맞춥니다.",
    category: "cloud",
    created_at: CREATED_AT,
  },
  {
    id: "21",
    question: "CDN(Content Delivery Network)의 주요 역할은?",
    options: [
      "사용자와 가까운 서버에서 콘텐츠를 전달해 지연을 줄인다",
      "데이터베이스 쿼리를 최적화한다",
      "서버의 CPU 성능을 높인다",
      "암호화 키를 보관한다",
    ],
    correct_answer: 0,
    explanation:
      "CDN은 전 세계에 분산된 엣지 서버에 콘텐츠를 캐시해, 사용자와 가까운 위치에서 응답함으로써 지연 시간과 원본 서버 부하를 줄입니다.",
    category: "cloud",
    created_at: CREATED_AT,
  },
  {
    id: "22",
    question: "서버리스(FaaS) 컴퓨팅의 특징으로 옳은 것은?",
    options: [
      "요청이 있을 때 실행되고 사용한 만큼 과금된다",
      "항상 켜져 있는 전용 서버가 필요하다",
      "운영체제 패치를 직접 관리해야 한다",
      "사용량과 무관하게 고정 비용만 발생한다",
    ],
    correct_answer: 0,
    explanation:
      "서버리스는 이벤트가 발생할 때만 함수가 실행되고 실행 시간과 호출 수에 따라 과금됩니다. 서버 프로비저닝과 패치는 제공자가 담당합니다.",
    category: "cloud",
    created_at: CREATED_AT,
  },
  {
    id: "23",
    question: "퀵 정렬(Quick Sort)의 평균 시간 복잡도는?",
    options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
    correct_answer: 1,
    explanation:
      "퀵 정렬의 평균 시간 복잡도는 O(n log n)입니다. 다만 피벗 선택이 최악일 때는 O(n²)까지 나빠질 수 있습니다.",
    category: "algorithm",
    created_at: CREATED_AT,
  },
  {
    id: "24",
    question: "해시 테이블의 평균 조회 시간 복잡도는?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correct_answer: 0,
    explanation:
      "해시 테이블은 키를 해시해 위치를 바로 계산하므로 평균 O(1)에 조회합니다. 충돌이 심하면 최악의 경우 O(n)이 될 수 있습니다.",
    category: "algorithm",
    created_at: CREATED_AT,
  },
  {
    id: "25",
    question: "스택(Stack) 자료 구조의 동작 방식은?",
    options: [
      "선입선출(FIFO)",
      "후입선출(LIFO)",
      "우선순위가 높은 순서",
      "임의 접근",
    ],
    correct_answer: 1,
    explanation:
      "스택은 마지막에 넣은 데이터를 먼저 꺼내는 후입선출(LIFO) 구조입니다. 선입선출은 큐(Queue)의 방식입니다.",
    category: "algorithm",
    created_at: CREATED_AT,
  },
  {
    id: "26",
    question: "지속적 통합(CI)의 목적으로 가장 알맞은 것은?",
    options: [
      "변경을 자주 통합하고 자동으로 검증해 통합 위험을 줄인다",
      "배포를 사람이 직접 수행하도록 강제한다",
      "코드 리뷰를 생략해 속도를 높인다",
      "서버를 수동으로 구축한다",
    ],
    correct_answer: 0,
    explanation:
      "CI는 작은 변경을 자주 main 브랜치에 통합하고 빌드·테스트를 자동 실행해, 통합 시점에 몰리는 충돌과 결함을 줄이는 방식입니다.",
    category: "devops",
    created_at: CREATED_AT,
  },
  {
    id: "27",
    question: "IaC(Infrastructure as Code)의 이점은?",
    options: [
      "인프라 구성을 코드로 관리해 같은 환경을 재현할 수 있다",
      "서버 비용이 항상 줄어든다",
      "네트워크 지연이 사라진다",
      "보안 취약점이 자동으로 제거된다",
    ],
    correct_answer: 0,
    explanation:
      "IaC는 인프라 정의를 코드로 남겨 버전 관리와 리뷰가 가능하게 하고, 동일한 환경을 반복해서 구성할 수 있게 합니다.",
    category: "devops",
    created_at: CREATED_AT,
  },
  {
    id: "28",
    question: "블루-그린(Blue-Green) 배포의 특징은?",
    options: [
      "동일한 두 환경을 두고 트래픽을 전환해 무중단 배포와 빠른 롤백을 지원한다",
      "모든 서버를 동시에 중단하고 교체한다",
      "테스트 없이 바로 운영에 반영한다",
      "롤백이 불가능하다",
    ],
    correct_answer: 0,
    explanation:
      "블루-그린 배포는 현재 버전(블루)과 새 버전(그린)을 동시에 두고 트래픽을 전환합니다. 문제가 생기면 트래픽을 되돌려 빠르게 롤백할 수 있습니다.",
    category: "devops",
    created_at: CREATED_AT,
  },
  {
    id: "29",
    question: "TCP와 UDP의 차이로 옳은 것은?",
    options: [
      "TCP는 연결 지향적이며 순서와 재전송을 보장한다",
      "UDP가 3-way handshake로 연결을 맺는다",
      "TCP는 데이터 순서를 보장하지 않는다",
      "UDP는 손실된 패킷을 항상 재전송한다",
    ],
    correct_answer: 0,
    explanation:
      "TCP는 연결을 맺고 순서 보장과 재전송으로 신뢰성을 제공합니다. UDP는 연결 없이 빠르게 보내지만 순서와 도착을 보장하지 않습니다.",
    category: "network",
    created_at: CREATED_AT,
  },
  {
    id: "30",
    question: "DNS의 주된 역할은?",
    options: [
      "도메인 이름을 IP 주소로 변환한다",
      "패킷의 최적 경로를 계산한다",
      "전송 데이터를 암호화한다",
      "장치에 IP 주소를 할당한다",
    ],
    correct_answer: 0,
    explanation:
      "DNS는 사람이 읽는 도메인 이름을 실제 통신에 필요한 IP 주소로 변환하는 이름 해석 시스템입니다.",
    category: "network",
    created_at: CREATED_AT,
  },
  {
    id: "31",
    question: "HTTPS가 사용하는 기본 포트 번호는?",
    options: ["21", "80", "443", "8080"],
    correct_answer: 2,
    explanation:
      "HTTPS의 기본 포트는 443입니다. 80은 HTTP, 21은 FTP의 기본 포트입니다.",
    category: "network",
    created_at: CREATED_AT,
  },
  {
    id: "32",
    question: "DHCP가 하는 일은?",
    options: [
      "네트워크에 연결된 장치에 IP 주소를 자동으로 할당한다",
      "도메인 이름을 변환한다",
      "패킷을 필터링한다",
      "대역폭을 측정한다",
    ],
    correct_answer: 0,
    explanation:
      "DHCP는 네트워크에 접속한 장치에 IP 주소, 서브넷 마스크, 게이트웨이 같은 설정을 자동으로 배포합니다.",
    category: "network",
    created_at: CREATED_AT,
  },
  {
    id: "33",
    question: "React Native의 특징으로 옳은 것은?",
    options: [
      "하나의 코드베이스로 iOS와 Android 앱을 만들 수 있다",
      "웹 브라우저에서만 동작한다",
      "네이티브 모듈을 전혀 사용할 수 없다",
      "Android 전용 프레임워크다",
    ],
    correct_answer: 0,
    explanation:
      "React Native는 JavaScript와 React로 iOS·Android 앱을 함께 개발할 수 있게 하며, 필요하면 네이티브 모듈을 연결할 수 있습니다.",
    category: "mobile",
    created_at: CREATED_AT,
  },
  {
    id: "34",
    question: "모바일 앱에서 딥링크(Deep Link)의 역할은?",
    options: [
      "링크를 통해 앱의 특정 화면으로 바로 이동시킨다",
      "앱의 설치 용량을 줄인다",
      "백그라운드 작업을 예약한다",
      "푸시 알림을 암호화한다",
    ],
    correct_answer: 0,
    explanation:
      "딥링크는 앱의 첫 화면이 아니라 특정 콘텐츠나 화면으로 바로 진입시키는 링크입니다. 공유와 알림에서 사용자 경험을 매끄럽게 만듭니다.",
    category: "mobile",
    created_at: CREATED_AT,
  },
  {
    id: "35",
    question: "iOS 앱 개발에 주로 사용하는 언어는?",
    options: ["Swift", "Kotlin", "Dart", "Ruby"],
    correct_answer: 0,
    explanation:
      "iOS 앱은 주로 Swift로 개발합니다. Kotlin은 Android, Dart는 Flutter에서 사용합니다.",
    category: "mobile",
    created_at: CREATED_AT,
  },
  {
    id: "36",
    question: "모바일 화면에서 권장되는 최소 터치 영역 크기는?",
    options: [
      "약 44pt(iOS) 또는 48dp(Android) 이상",
      "10px 이상",
      "화면 너비의 절반 이상",
      "제한이 없다",
    ],
    correct_answer: 0,
    explanation:
      "Apple은 44×44pt, Google은 48×48dp 이상을 권장합니다. 터치 영역이 작으면 오작동이 늘고 접근성이 떨어집니다.",
    category: "mobile",
    created_at: CREATED_AT,
  },
  {
    id: "37",
    question: "다음 오픈소스 라이선스 중 카피레프트 성격이 가장 강한 것은?",
    options: ["MIT", "Apache 2.0", "GPL", "BSD"],
    correct_answer: 2,
    explanation:
      "GPL은 파생 저작물도 같은 라이선스로 공개하도록 요구하는 강한 카피레프트 라이선스입니다. MIT, Apache 2.0, BSD는 상대적으로 제약이 적은 허용적 라이선스입니다.",
    category: "general",
    created_at: CREATED_AT,
  },
  {
    id: "38",
    question:
      "시맨틱 버저닝(SemVer)에서 MAJOR 버전을 올려야 하는 경우는?",
    options: [
      "기존과 호환되지 않는 변경이 있을 때",
      "버그를 수정했을 때",
      "문서를 수정했을 때",
      "호환성을 유지하는 기능을 추가했을 때",
    ],
    correct_answer: 0,
    explanation:
      "SemVer에서 MAJOR는 호환성이 깨지는 변경, MINOR는 호환되는 기능 추가, PATCH는 호환되는 버그 수정에 올립니다.",
    category: "general",
    created_at: CREATED_AT,
  },
  {
    id: "39",
    question: "코드 리뷰의 주된 목적으로 가장 알맞은 것은?",
    options: [
      "결함을 일찍 발견하고 팀의 지식을 공유한다",
      "작성자의 실력을 평가한다",
      "코드 줄 수를 늘린다",
      "배포 속도를 의도적으로 늦춘다",
    ],
    correct_answer: 0,
    explanation:
      "코드 리뷰는 병합 전에 결함과 설계 문제를 발견하고, 변경 내용을 팀이 공유해 유지보수성을 높이는 활동입니다.",
    category: "general",
    created_at: CREATED_AT,
  },
  {
    id: "40",
    question: "한국 표준시(KST)와 협정 세계시(UTC)의 관계로 옳은 것은?",
    options: [
      "KST는 UTC보다 9시간 빠르다",
      "KST는 UTC보다 9시간 느리다",
      "KST와 UTC는 같다",
      "KST는 UTC보다 3시간 빠르다",
    ],
    correct_answer: 0,
    explanation:
      "KST는 UTC+09:00으로 UTC보다 9시간 빠릅니다. 서버가 UTC로 기록한 시각을 사용자 날짜로 바꿀 때 이 차이를 고려해야 합니다.",
    category: "general",
    created_at: CREATED_AT,
  },
];
