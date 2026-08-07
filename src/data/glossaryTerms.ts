import type { GlossaryTerm } from "@/types/glossary";

/** 정적 데이터의 생성 시각. 모듈이 로드될 때마다 값이 달라지지 않도록 고정한다. */
const CREATED_AT = "2026-08-07T00:00:00.000Z";

/**
 * IT 용어 사전.
 * 빠르게 찾아보는 용도라 정의는 한두 문장으로 짧게 유지하고,
 * 깊은 설명은 CS 지식 문항(`csQuestions`)에 맡긴다.
 */
export const glossaryTerms: GlossaryTerm[] = [
  {
    id: "tcp",
    term: "TCP",
    definition:
      "연결을 맺은 뒤 데이터를 주고받는 전송 계층 프로토콜입니다. 순서 보장과 재전송으로 신뢰성을 제공하는 대신 UDP보다 오버헤드가 큽니다.",
    aliases: ["Transmission Control Protocol", "전송 제어 프로토콜"],
    category: "network",
    related: ["udp", "three-way-handshake", "http"],
    created_at: CREATED_AT,
  },
  {
    id: "udp",
    term: "UDP",
    definition:
      "연결 없이 데이터그램을 보내는 전송 계층 프로토콜입니다. 순서와 도착을 보장하지 않는 대신 지연이 적어 실시간 전송에 쓰입니다.",
    aliases: ["User Datagram Protocol", "사용자 데이터그램 프로토콜"],
    category: "network",
    related: ["tcp"],
    created_at: CREATED_AT,
  },
  {
    id: "three-way-handshake",
    term: "3-way handshake",
    definition:
      "TCP 연결을 맺기 위해 SYN, SYN-ACK, ACK를 주고받는 과정입니다. 양쪽이 초기 시퀀스 번호를 교환하고 수신 가능 상태를 확인합니다.",
    aliases: ["3방향 핸드셰이크", "쓰리웨이 핸드셰이크"],
    category: "network",
    related: ["tcp"],
    created_at: CREATED_AT,
  },
  {
    id: "http",
    term: "HTTP",
    definition:
      "웹에서 클라이언트와 서버가 요청과 응답을 주고받는 프로토콜입니다. 상태를 유지하지 않으며 메서드와 상태 코드로 의미를 표현합니다.",
    aliases: ["HyperText Transfer Protocol"],
    category: "network",
    related: ["https", "rest", "cors"],
    created_at: CREATED_AT,
  },
  {
    id: "https",
    term: "HTTPS",
    definition:
      "HTTP 통신을 TLS로 암호화한 방식입니다. 도청과 변조를 막고 인증서로 서버 신원을 확인하며 기본 포트는 443입니다.",
    aliases: ["HTTP Secure"],
    category: "network",
    related: ["http", "tls"],
    created_at: CREATED_AT,
  },
  {
    id: "tls",
    term: "TLS",
    definition:
      "네트워크 구간의 데이터를 암호화하는 보안 프로토콜입니다. 핸드셰이크로 대칭키를 교환한 뒤 그 키로 본문을 암호화합니다.",
    aliases: ["Transport Layer Security", "SSL"],
    category: "network",
    related: ["https"],
    created_at: CREATED_AT,
  },
  {
    id: "dns",
    term: "DNS",
    definition:
      "도메인 이름을 IP 주소로 바꿔주는 이름 해석 시스템입니다. 루트, TLD, 권한 네임서버를 거쳐 조회하며 결과는 TTL 동안 캐시됩니다.",
    aliases: ["Domain Name System", "도메인 네임 시스템"],
    category: "network",
    related: ["ip-address"],
    created_at: CREATED_AT,
  },
  {
    id: "ip-address",
    term: "IP 주소",
    definition:
      "네트워크에서 장치를 식별하는 주소입니다. IPv4는 32비트, IPv6는 128비트를 사용하며 라우팅의 기준이 됩니다.",
    aliases: ["IP address", "아이피 주소"],
    category: "network",
    related: ["dns", "port"],
    created_at: CREATED_AT,
  },
  {
    id: "port",
    term: "포트",
    definition:
      "한 장치 안에서 통신 대상 프로그램을 구분하는 번호입니다. HTTP는 80, HTTPS는 443처럼 잘 알려진 번호가 정해져 있습니다.",
    aliases: ["port"],
    category: "network",
    related: ["ip-address", "https"],
    created_at: CREATED_AT,
  },
  {
    id: "load-balancer",
    term: "로드 밸런서",
    definition:
      "여러 서버에 트래픽을 나눠 보내 부하를 분산하는 장치나 서비스입니다. 헬스 체크로 비정상 서버를 제외해 가용성을 높입니다.",
    aliases: ["load balancer", "LB"],
    category: "network",
    related: ["horizontal-scaling", "cdn"],
    created_at: CREATED_AT,
  },
  {
    id: "cdn",
    term: "CDN",
    definition:
      "전 세계에 분산된 서버에 콘텐츠를 캐시해 사용자와 가까운 곳에서 전달하는 네트워크입니다. 지연과 원본 서버 부하를 줄입니다.",
    aliases: ["Content Delivery Network", "콘텐츠 전송 네트워크"],
    category: "network",
    related: ["cache", "load-balancer"],
    created_at: CREATED_AT,
  },
  {
    id: "proxy",
    term: "프록시",
    definition:
      "클라이언트와 서버 사이에서 요청을 대신 전달하는 중계 서버입니다. 캐싱, 접근 제어, 부하 분산 같은 목적으로 사용합니다.",
    aliases: ["proxy", "리버스 프록시", "reverse proxy"],
    category: "network",
    related: ["load-balancer", "cache"],
    created_at: CREATED_AT,
  },
  {
    id: "websocket",
    term: "WebSocket",
    definition:
      "한 번 연결하면 서버와 클라이언트가 양방향으로 메시지를 주고받는 프로토콜입니다. 실시간 채팅이나 알림에 사용합니다.",
    aliases: ["웹소켓"],
    category: "network",
    related: ["http"],
    created_at: CREATED_AT,
  },
  {
    id: "rest",
    term: "REST",
    definition:
      "자원을 URI로 표현하고 HTTP 메서드로 행위를 나타내는 API 설계 방식입니다. 무상태성과 균일한 인터페이스를 제약으로 둡니다.",
    aliases: ["RESTful", "Representational State Transfer"],
    category: "network",
    related: ["http", "api", "idempotency"],
    created_at: CREATED_AT,
  },
  {
    id: "cors",
    term: "CORS",
    definition:
      "브라우저가 다른 출처의 응답을 읽을 수 있는지 서버가 헤더로 알려주는 규약입니다. 동일 출처 정책을 완화하는 브라우저 정책입니다.",
    aliases: ["Cross-Origin Resource Sharing", "교차 출처 리소스 공유"],
    category: "network",
    related: ["http", "same-origin-policy"],
    created_at: CREATED_AT,
  },
  {
    id: "same-origin-policy",
    term: "동일 출처 정책",
    definition:
      "프로토콜, 호스트, 포트가 모두 같아야 다른 문서의 자원에 접근할 수 있게 제한하는 브라우저 보안 정책입니다.",
    aliases: ["Same-Origin Policy", "SOP"],
    category: "network",
    related: ["cors"],
    created_at: CREATED_AT,
  },
  {
    id: "process",
    term: "프로세스",
    definition:
      "실행 중인 프로그램의 단위로 독립된 메모리 공간을 갖습니다. 프로세스끼리는 메모리를 공유하지 않아 통신에 별도 수단이 필요합니다.",
    aliases: ["process"],
    category: "os",
    related: ["thread", "context-switching"],
    created_at: CREATED_AT,
  },
  {
    id: "thread",
    term: "스레드",
    definition:
      "프로세스 안의 실행 흐름으로 코드와 데이터, 힙을 공유하고 스택과 레지스터만 따로 가집니다. 전환 비용이 프로세스보다 적습니다.",
    aliases: ["thread"],
    category: "os",
    related: ["process", "mutex", "race-condition"],
    created_at: CREATED_AT,
  },
  {
    id: "context-switching",
    term: "컨텍스트 스위칭",
    definition:
      "CPU가 실행 중인 작업을 바꿀 때 현재 상태를 저장하고 다음 작업 상태를 복원하는 과정입니다. 캐시 무효화 때문에 간접 비용이 큽니다.",
    aliases: ["context switching", "문맥 교환"],
    category: "os",
    related: ["process", "thread", "scheduler"],
    created_at: CREATED_AT,
  },
  {
    id: "deadlock",
    term: "교착 상태",
    definition:
      "여러 작업이 서로가 가진 자원을 기다리며 아무도 진행하지 못하는 상태입니다. 상호 배제, 점유와 대기, 비선점, 순환 대기가 모두 성립할 때 발생합니다.",
    aliases: ["deadlock", "데드락"],
    category: "os",
    related: ["mutex", "semaphore"],
    created_at: CREATED_AT,
  },
  {
    id: "mutex",
    term: "뮤텍스",
    definition:
      "한 번에 하나의 스레드만 임계 구역에 들어가게 하는 잠금입니다. 잠근 주체가 해제해야 하는 소유 개념이 있습니다.",
    aliases: ["mutex", "상호 배제"],
    category: "os",
    related: ["semaphore", "critical-section", "deadlock"],
    created_at: CREATED_AT,
  },
  {
    id: "semaphore",
    term: "세마포어",
    definition:
      "동시에 접근 가능한 자원 수를 카운터로 제어하는 동기화 도구입니다. 소유 개념이 없어 다른 스레드가 신호를 줄 수 있습니다.",
    aliases: ["semaphore"],
    category: "os",
    related: ["mutex", "deadlock"],
    created_at: CREATED_AT,
  },
  {
    id: "critical-section",
    term: "임계 구역",
    definition:
      "여러 스레드가 공유 자원에 접근하는 코드 구간입니다. 동시에 실행되면 데이터가 깨질 수 있어 잠금으로 보호합니다.",
    aliases: ["critical section"],
    category: "os",
    related: ["mutex", "race-condition"],
    created_at: CREATED_AT,
  },
  {
    id: "race-condition",
    term: "경쟁 상태",
    definition:
      "여러 실행 흐름의 순서에 따라 결과가 달라지는 상황입니다. 공유 자원을 동기화하지 않고 접근할 때 발생합니다.",
    aliases: ["race condition", "레이스 컨디션"],
    category: "os",
    related: ["critical-section", "mutex", "optimistic-lock"],
    created_at: CREATED_AT,
  },
  {
    id: "virtual-memory",
    term: "가상 메모리",
    definition:
      "프로세스마다 연속된 가상 주소 공간을 제공하고 물리 메모리와 분리하는 기법입니다. 물리 메모리보다 큰 프로그램도 실행할 수 있습니다.",
    aliases: ["virtual memory"],
    category: "os",
    related: ["paging", "page-fault"],
    created_at: CREATED_AT,
  },
  {
    id: "paging",
    term: "페이징",
    definition:
      "메모리를 고정 크기 페이지로 나눠 물리 프레임에 매핑하는 방식입니다. 매핑 정보는 페이지 테이블에 두고 TLB로 조회를 가속합니다.",
    aliases: ["paging"],
    category: "os",
    related: ["virtual-memory", "page-fault"],
    created_at: CREATED_AT,
  },
  {
    id: "page-fault",
    term: "페이지 폴트",
    definition:
      "접근하려는 페이지가 물리 메모리에 없을 때 발생하는 예외입니다. 디스크에서 페이지를 올려야 해 비용이 크고, 잦으면 스래싱이 됩니다.",
    aliases: ["page fault"],
    category: "os",
    related: ["paging", "virtual-memory"],
    created_at: CREATED_AT,
  },
  {
    id: "system-call",
    term: "시스템 콜",
    definition:
      "사용자 모드 프로그램이 커널의 기능을 요청하는 인터페이스입니다. 파일 입출력처럼 특권이 필요한 작업에 사용하며 모드 전환 비용이 듭니다.",
    aliases: ["system call", "syscall"],
    category: "os",
    related: ["kernel"],
    created_at: CREATED_AT,
  },
  {
    id: "kernel",
    term: "커널",
    definition:
      "하드웨어와 응용 프로그램 사이에서 자원을 관리하는 운영체제의 핵심입니다. 메모리, 프로세스, 장치 접근을 통제합니다.",
    aliases: ["kernel"],
    category: "os",
    related: ["system-call", "scheduler"],
    created_at: CREATED_AT,
  },
  {
    id: "scheduler",
    term: "스케줄러",
    definition:
      "실행 대기 중인 작업 중 다음에 CPU를 사용할 작업을 고르는 커널 구성 요소입니다. 라운드 로빈이나 우선순위 같은 정책을 사용합니다.",
    aliases: ["scheduler", "스케줄링"],
    category: "os",
    related: ["context-switching", "kernel"],
    created_at: CREATED_AT,
  },
  {
    id: "blocking-nonblocking",
    term: "블로킹과 논블로킹",
    definition:
      "호출이 끝날 때까지 제어권을 돌려주지 않으면 블로킹, 즉시 반환하면 논블로킹입니다. 동기·비동기와는 다른 축의 구분입니다.",
    aliases: ["blocking", "non-blocking", "논블로킹"],
    category: "os",
    related: ["event-loop"],
    created_at: CREATED_AT,
  },
  {
    id: "index",
    term: "인덱스",
    definition:
      "조회 속도를 높이기 위해 정렬된 구조로 데이터 위치를 따로 저장하는 것입니다. 조회는 빨라지지만 쓰기 비용과 저장 공간이 늘어납니다.",
    aliases: ["index", "색인"],
    category: "database",
    related: ["b-tree", "query-plan"],
    created_at: CREATED_AT,
  },
  {
    id: "b-tree",
    term: "B-Tree",
    definition:
      "한 노드에 여러 키를 담아 높이를 낮춘 균형 트리입니다. 디스크 접근 횟수를 줄여 대부분의 데이터베이스 인덱스에 쓰입니다.",
    aliases: ["비트리", "B+Tree"],
    category: "database",
    related: ["index", "binary-search-tree"],
    created_at: CREATED_AT,
  },
  {
    id: "transaction",
    term: "트랜잭션",
    definition:
      "하나의 논리적 작업 단위로 묶인 데이터 조작입니다. 전부 반영되거나 전부 취소되며 ACID 성질로 신뢰성을 보장합니다.",
    aliases: ["transaction"],
    category: "database",
    related: ["acid", "isolation-level", "rollback"],
    created_at: CREATED_AT,
  },
  {
    id: "acid",
    term: "ACID",
    definition:
      "트랜잭션이 지켜야 할 네 가지 성질로 원자성, 일관성, 격리성, 지속성을 뜻합니다.",
    aliases: ["원자성", "지속성"],
    category: "database",
    related: ["transaction", "isolation-level"],
    created_at: CREATED_AT,
  },
  {
    id: "isolation-level",
    term: "격리 수준",
    definition:
      "동시에 실행되는 트랜잭션이 서로를 얼마나 볼 수 있는지 정하는 단계입니다. 엄격할수록 이상 현상이 줄지만 동시성이 낮아집니다.",
    aliases: ["isolation level", "READ COMMITTED", "SERIALIZABLE"],
    category: "database",
    related: ["transaction", "acid", "mvcc"],
    created_at: CREATED_AT,
  },
  {
    id: "mvcc",
    term: "MVCC",
    definition:
      "같은 데이터의 여러 버전을 유지해 읽기와 쓰기가 서로를 막지 않게 하는 동시성 제어 방식입니다.",
    aliases: ["Multi-Version Concurrency Control", "다중 버전 동시성 제어"],
    category: "database",
    related: ["isolation-level", "optimistic-lock"],
    created_at: CREATED_AT,
  },
  {
    id: "rollback",
    term: "롤백",
    definition:
      "트랜잭션 중 오류가 났을 때 변경을 취소하고 시작 이전 상태로 되돌리는 것입니다.",
    aliases: ["rollback", "커밋", "commit"],
    category: "database",
    related: ["transaction"],
    created_at: CREATED_AT,
  },
  {
    id: "normalization",
    term: "정규화",
    definition:
      "중복을 제거해 이상 현상을 막는 데이터베이스 설계 과정입니다. 일관성은 높아지지만 조인이 늘어 조회 성능이 떨어질 수 있습니다.",
    aliases: ["normalization", "반정규화", "denormalization"],
    category: "database",
    related: ["foreign-key", "join"],
    created_at: CREATED_AT,
  },
  {
    id: "primary-key",
    term: "기본 키",
    definition:
      "테이블에서 각 행을 고유하게 식별하는 컬럼이나 컬럼 조합입니다. 중복과 NULL을 허용하지 않습니다.",
    aliases: ["primary key", "PK"],
    category: "database",
    related: ["foreign-key", "index"],
    created_at: CREATED_AT,
  },
  {
    id: "foreign-key",
    term: "외래 키",
    definition:
      "다른 테이블의 기본 키를 참조하는 컬럼입니다. 참조 무결성을 보장해 존재하지 않는 값이 저장되는 것을 막습니다.",
    aliases: ["foreign key", "FK", "참조 무결성"],
    category: "database",
    related: ["primary-key", "normalization"],
    created_at: CREATED_AT,
  },
  {
    id: "join",
    term: "조인",
    definition:
      "여러 테이블을 연결해 하나의 결과로 조회하는 연산입니다. INNER, LEFT, FULL OUTER 등 남길 행의 범위에 따라 종류가 나뉩니다.",
    aliases: ["join", "INNER JOIN", "LEFT JOIN"],
    category: "database",
    related: ["normalization", "n-plus-one"],
    created_at: CREATED_AT,
  },
  {
    id: "optimistic-lock",
    term: "낙관적 락",
    definition:
      "충돌이 드물다고 보고 잠그지 않은 채 진행하다가 커밋 시점에 버전으로 변경 여부를 확인하는 방식입니다. 충돌 시 재시도합니다.",
    aliases: ["optimistic lock", "비관적 락", "pessimistic lock"],
    category: "database",
    related: ["race-condition", "mvcc"],
    created_at: CREATED_AT,
  },
  {
    id: "connection-pool",
    term: "커넥션 풀",
    definition:
      "데이터베이스 연결을 미리 만들어 두고 재사용하는 구조입니다. 연결 생성 비용을 줄이고 동시 연결 수의 상한을 관리합니다.",
    aliases: ["connection pool"],
    category: "database",
    related: ["orm"],
    created_at: CREATED_AT,
  },
  {
    id: "sharding",
    term: "샤딩",
    definition:
      "데이터를 기준에 따라 여러 노드로 나눠 저장해 쓰기와 용량을 확장하는 방식입니다. 샤드 키 선택과 교차 조회가 과제입니다.",
    aliases: ["sharding", "파티셔닝", "partitioning"],
    category: "database",
    related: ["replica", "horizontal-scaling"],
    created_at: CREATED_AT,
  },
  {
    id: "replica",
    term: "레플리카",
    definition:
      "같은 데이터를 여러 노드에 복제해 읽기 부하를 분산하고 가용성을 높이는 구조입니다. 복제 지연으로 최신 데이터가 늦게 보일 수 있습니다.",
    aliases: ["replica", "replication", "복제본"],
    category: "database",
    related: ["sharding", "eventual-consistency"],
    created_at: CREATED_AT,
  },
  {
    id: "orm",
    term: "ORM",
    definition:
      "객체와 관계형 데이터베이스 테이블을 매핑해 SQL 없이 다루게 해주는 도구입니다. 편리하지만 실제 발생 쿼리를 확인해야 합니다.",
    aliases: ["Object-Relational Mapping", "객체 관계 매핑"],
    category: "database",
    related: ["n-plus-one", "connection-pool"],
    created_at: CREATED_AT,
  },
  {
    id: "n-plus-one",
    term: "N+1 문제",
    definition:
      "목록을 조회한 뒤 각 항목의 연관 데이터를 개별 쿼리로 가져와 쿼리 수가 선형으로 늘어나는 문제입니다. 조인이나 일괄 조회로 해결합니다.",
    aliases: ["N+1 problem", "N + 1"],
    category: "database",
    related: ["orm", "join"],
    created_at: CREATED_AT,
  },
  {
    id: "query-plan",
    term: "실행 계획",
    definition:
      "데이터베이스가 쿼리를 어떤 순서와 방법으로 처리할지 보여주는 정보입니다. 인덱스 사용 여부와 예상 행 수를 확인해 튜닝합니다.",
    aliases: ["query plan", "EXPLAIN"],
    category: "database",
    related: ["index"],
    created_at: CREATED_AT,
  },
  {
    id: "migration",
    term: "마이그레이션",
    definition:
      "데이터베이스 스키마 변경을 파일로 관리하고 순서대로 적용하는 방식입니다. 파일 생성과 실제 운영 반영은 별개의 작업입니다.",
    aliases: ["migration", "스키마 변경"],
    category: "database",
    related: ["transaction"],
    created_at: CREATED_AT,
  },
  {
    id: "rls",
    term: "RLS",
    definition:
      "행 단위로 접근 권한을 제어하는 데이터베이스 보안 기능입니다. 정책을 걸어 사용자가 자신의 행만 읽고 쓰게 제한합니다.",
    aliases: ["Row Level Security", "행 수준 보안"],
    category: "database",
    related: ["authorization"],
    created_at: CREATED_AT,
  },
  {
    id: "big-o",
    term: "빅오 표기법",
    definition:
      "입력 크기가 커질 때 연산 횟수나 메모리가 늘어나는 추세를 나타내는 표기입니다. 상수와 낮은 차수 항을 무시하고 상한을 표현합니다.",
    aliases: ["Big-O", "시간 복잡도", "공간 복잡도"],
    category: "algorithm",
    related: ["binary-search", "hash-table"],
    created_at: CREATED_AT,
  },
  {
    id: "array",
    term: "배열",
    definition:
      "연속된 메모리에 같은 종류의 값을 나열한 자료 구조입니다. 인덱스로 즉시 접근하지만 중간 삽입과 삭제 비용이 큽니다.",
    aliases: ["array"],
    category: "algorithm",
    related: ["linked-list"],
    created_at: CREATED_AT,
  },
  {
    id: "linked-list",
    term: "연결 리스트",
    definition:
      "노드가 포인터로 이어진 자료 구조입니다. 삽입과 삭제가 저렴한 대신 특정 위치에 접근하려면 순회해야 합니다.",
    aliases: ["linked list"],
    category: "algorithm",
    related: ["array", "stack", "queue"],
    created_at: CREATED_AT,
  },
  {
    id: "stack",
    term: "스택",
    definition:
      "마지막에 넣은 값을 먼저 꺼내는 후입선출 구조입니다. 함수 호출 관리와 실행 취소, 깊이 우선 탐색에 사용합니다.",
    aliases: ["stack", "LIFO"],
    category: "algorithm",
    related: ["queue", "dfs"],
    created_at: CREATED_AT,
  },
  {
    id: "queue",
    term: "큐",
    definition:
      "먼저 넣은 값을 먼저 꺼내는 선입선출 구조입니다. 작업 대기열과 너비 우선 탐색에 사용합니다.",
    aliases: ["queue", "FIFO", "덱", "deque"],
    category: "algorithm",
    related: ["stack", "bfs", "message-queue"],
    created_at: CREATED_AT,
  },
  {
    id: "hash-table",
    term: "해시 테이블",
    definition:
      "키를 해시해 저장 위치를 계산하는 자료 구조입니다. 평균 O(1)에 조회하지만 충돌이 심하면 성능이 떨어집니다.",
    aliases: ["hash table", "해시맵", "hash map"],
    category: "algorithm",
    related: ["big-o", "hash-collision"],
    created_at: CREATED_AT,
  },
  {
    id: "hash-collision",
    term: "해시 충돌",
    definition:
      "서로 다른 키가 같은 버킷에 배정되는 상황입니다. 체이닝이나 개방 주소법으로 해결하고 적재율이 높아지면 다시 해싱합니다.",
    aliases: ["hash collision", "체이닝", "chaining"],
    category: "algorithm",
    related: ["hash-table"],
    created_at: CREATED_AT,
  },
  {
    id: "binary-search",
    term: "이진 탐색",
    definition:
      "정렬된 데이터에서 중간값과 비교해 탐색 범위를 절반씩 줄이는 알고리즘입니다. 시간 복잡도는 O(log n)입니다.",
    aliases: ["binary search"],
    category: "algorithm",
    related: ["big-o", "binary-search-tree"],
    created_at: CREATED_AT,
  },
  {
    id: "binary-search-tree",
    term: "이진 탐색 트리",
    definition:
      "왼쪽 자식이 부모보다 작고 오른쪽이 큰 트리입니다. 한쪽으로 치우치면 성능이 나빠져 균형 트리로 보완합니다.",
    aliases: ["BST", "binary search tree", "AVL", "레드-블랙 트리"],
    category: "algorithm",
    related: ["binary-search", "b-tree", "heap"],
    created_at: CREATED_AT,
  },
  {
    id: "heap",
    term: "힙",
    definition:
      "부모가 자식보다 항상 크거나 작은 완전 이진 트리입니다. 최댓값이나 최솟값을 빠르게 꺼낼 수 있어 우선순위 큐로 씁니다.",
    aliases: ["heap", "우선순위 큐", "priority queue"],
    category: "algorithm",
    related: ["binary-search-tree", "queue"],
    created_at: CREATED_AT,
  },
  {
    id: "graph",
    term: "그래프",
    definition:
      "정점과 간선으로 관계를 표현하는 자료 구조입니다. 방향과 가중치 유무에 따라 종류가 나뉩니다.",
    aliases: ["graph", "정점", "간선"],
    category: "algorithm",
    related: ["dfs", "bfs"],
    created_at: CREATED_AT,
  },
  {
    id: "dfs",
    term: "깊이 우선 탐색",
    definition:
      "한 갈래를 끝까지 파고든 뒤 되돌아오는 탐색 방식입니다. 스택이나 재귀로 구현하며 모든 경로 탐색에 적합합니다.",
    aliases: ["DFS", "depth-first search"],
    category: "algorithm",
    related: ["bfs", "graph", "stack", "recursion"],
    created_at: CREATED_AT,
  },
  {
    id: "bfs",
    term: "너비 우선 탐색",
    definition:
      "가까운 정점부터 층별로 방문하는 탐색 방식입니다. 큐로 구현하며 가중치가 같은 그래프의 최단 경로에 적합합니다.",
    aliases: ["BFS", "breadth-first search"],
    category: "algorithm",
    related: ["dfs", "graph", "queue"],
    created_at: CREATED_AT,
  },
  {
    id: "dynamic-programming",
    term: "동적 계획법",
    definition:
      "겹치는 하위 문제의 결과를 저장해 재사용하는 기법입니다. 최적 부분 구조와 중복 부분 문제가 성립할 때 사용합니다.",
    aliases: ["DP", "dynamic programming", "메모이제이션", "memoization"],
    category: "algorithm",
    related: ["recursion", "greedy"],
    created_at: CREATED_AT,
  },
  {
    id: "greedy",
    term: "그리디 알고리즘",
    definition:
      "매 단계에서 지역 최적을 고르는 방식입니다. 탐욕적 선택 속성과 최적 부분 구조가 성립할 때만 전체 최적을 보장합니다.",
    aliases: ["greedy", "탐욕법"],
    category: "algorithm",
    related: ["dynamic-programming"],
    created_at: CREATED_AT,
  },
  {
    id: "recursion",
    term: "재귀",
    definition:
      "함수가 자기 자신을 호출해 문제를 더 작은 문제로 나누는 방식입니다. 종료 조건이 없으면 호출 스택이 넘칩니다.",
    aliases: ["recursion", "재귀 호출"],
    category: "algorithm",
    related: ["stack", "dynamic-programming", "dfs"],
    created_at: CREATED_AT,
  },
  {
    id: "dom",
    term: "DOM",
    definition:
      "HTML 문서를 객체 트리로 표현한 구조입니다. 스크립트가 이 트리를 조작해 화면을 바꿉니다.",
    aliases: ["Document Object Model", "돔"],
    category: "frontend",
    related: ["virtual-dom", "reflow"],
    created_at: CREATED_AT,
  },
  {
    id: "virtual-dom",
    term: "가상 DOM",
    definition:
      "실제 DOM을 흉내 낸 자바스크립트 객체 트리입니다. 변경 전후를 비교해 바뀐 부분만 실제 DOM에 반영합니다.",
    aliases: ["Virtual DOM", "VDOM"],
    category: "frontend",
    related: ["dom", "reflow"],
    created_at: CREATED_AT,
  },
  {
    id: "csr",
    term: "CSR",
    definition:
      "브라우저가 자바스크립트로 화면을 그리는 방식입니다. 초기 로딩이 느리고 검색에 불리하지만 이후 상호작용이 부드럽습니다.",
    aliases: ["Client-Side Rendering", "클라이언트 사이드 렌더링"],
    category: "frontend",
    related: ["ssr", "ssg", "hydration"],
    created_at: CREATED_AT,
  },
  {
    id: "ssr",
    term: "SSR",
    definition:
      "요청마다 서버에서 HTML을 만들어 보내는 방식입니다. 초기 표시와 검색 노출에 유리하지만 서버 부하가 있습니다.",
    aliases: ["Server-Side Rendering", "서버 사이드 렌더링"],
    category: "frontend",
    related: ["csr", "ssg", "hydration"],
    created_at: CREATED_AT,
  },
  {
    id: "ssg",
    term: "SSG",
    definition:
      "빌드 시점에 HTML을 미리 만들어 두는 방식입니다. 가장 빠르지만 데이터가 자주 바뀌면 적합하지 않습니다.",
    aliases: ["Static Site Generation", "정적 사이트 생성", "프리렌더"],
    category: "frontend",
    related: ["ssr", "csr"],
    created_at: CREATED_AT,
  },
  {
    id: "hydration",
    term: "하이드레이션",
    definition:
      "서버가 보낸 HTML에 자바스크립트를 붙여 상호작용이 가능한 상태로 만드는 과정입니다.",
    aliases: ["hydration"],
    category: "frontend",
    related: ["ssr", "ssg"],
    created_at: CREATED_AT,
  },
  {
    id: "reflow",
    term: "리플로우",
    definition:
      "요소의 크기나 위치가 바뀌어 레이아웃을 다시 계산하는 과정입니다. 리페인트보다 비용이 커 애니메이션에서 피해야 합니다.",
    aliases: ["reflow", "리페인트", "repaint", "레이아웃"],
    category: "frontend",
    related: ["dom", "lcp"],
    created_at: CREATED_AT,
  },
  {
    id: "lcp",
    term: "LCP",
    definition:
      "화면에서 가장 큰 콘텐츠가 표시되기까지 걸린 시간입니다. 로딩 체감을 나타내는 핵심 웹 지표입니다.",
    aliases: ["Largest Contentful Paint", "CLS", "핵심 웹 지표"],
    category: "frontend",
    related: ["reflow", "code-splitting"],
    created_at: CREATED_AT,
  },
  {
    id: "bundler",
    term: "번들러",
    definition:
      "여러 모듈을 묶어 배포용 파일로 만드는 도구입니다. 의존성을 해석하고 사용하지 않는 코드를 제거합니다.",
    aliases: ["bundler", "webpack", "번들링"],
    category: "frontend",
    related: ["tree-shaking", "code-splitting"],
    created_at: CREATED_AT,
  },
  {
    id: "tree-shaking",
    term: "트리 셰이킹",
    definition:
      "사용하지 않는 코드를 번들에서 제거하는 최적화입니다. 정적으로 분석 가능한 모듈 구조가 전제입니다.",
    aliases: ["tree shaking"],
    category: "frontend",
    related: ["bundler", "code-splitting"],
    created_at: CREATED_AT,
  },
  {
    id: "code-splitting",
    term: "코드 스플리팅",
    definition:
      "번들을 여러 조각으로 나눠 필요한 시점에 불러오는 기법입니다. 초기 로딩 부담을 줄입니다.",
    aliases: ["code splitting", "지연 로딩", "lazy loading"],
    category: "frontend",
    related: ["bundler", "tree-shaking", "lcp"],
    created_at: CREATED_AT,
  },
  {
    id: "closure",
    term: "클로저",
    definition:
      "함수가 선언될 때의 환경을 기억해, 외부 함수 실행이 끝난 뒤에도 그 변수에 접근할 수 있는 성질입니다.",
    aliases: ["closure"],
    category: "frontend",
    related: ["event-loop"],
    created_at: CREATED_AT,
  },
  {
    id: "event-loop",
    term: "이벤트 루프",
    definition:
      "콜 스택이 비면 큐에서 콜백을 꺼내 실행하는 자바스크립트의 실행 구조입니다. 마이크로태스크를 매크로태스크보다 먼저 처리합니다.",
    aliases: ["event loop", "태스크 큐", "마이크로태스크"],
    category: "frontend",
    related: ["promise", "blocking-nonblocking"],
    created_at: CREATED_AT,
  },
  {
    id: "promise",
    term: "프로미스",
    definition:
      "비동기 작업의 결과를 나타내는 객체입니다. 대기에서 이행 또는 거부로 한 번만 전이하며 async/await와 함께 사용합니다.",
    aliases: ["Promise", "async", "await"],
    category: "frontend",
    related: ["event-loop"],
    created_at: CREATED_AT,
  },
  {
    id: "immutability",
    term: "불변성",
    definition:
      "데이터를 직접 수정하지 않고 새 값을 만들어 다루는 원칙입니다. 참조 비교로 변경을 감지할 수 있어 렌더링 정확성과 직결됩니다.",
    aliases: ["immutability", "얕은 복사", "깊은 복사"],
    category: "frontend",
    related: ["pure-function", "state-management"],
    created_at: CREATED_AT,
  },
  {
    id: "pure-function",
    term: "순수 함수",
    definition:
      "같은 입력에 항상 같은 결과를 내고 외부 상태를 바꾸지 않는 함수입니다. 테스트와 추론이 쉽습니다.",
    aliases: ["pure function", "부수 효과", "side effect"],
    category: "frontend",
    related: ["immutability"],
    created_at: CREATED_AT,
  },
  {
    id: "state-management",
    term: "상태 관리",
    definition:
      "화면이 참조하는 데이터를 어디에 두고 어떻게 갱신할지 다루는 방법입니다. 서버 상태와 클라이언트 상태를 구분해 관리합니다.",
    aliases: ["state management", "전역 상태"],
    category: "frontend",
    related: ["immutability", "cache"],
    created_at: CREATED_AT,
  },
  {
    id: "accessibility",
    term: "웹 접근성",
    definition:
      "누구나 콘텐츠를 이용할 수 있게 만드는 설계 원칙입니다. 시맨틱 마크업, 키보드 조작, 명도 대비, 대체 텍스트를 포함합니다.",
    aliases: ["accessibility", "a11y", "ARIA", "스크린 리더"],
    category: "frontend",
    related: ["dom"],
    created_at: CREATED_AT,
  },
  {
    id: "responsive-web",
    term: "반응형 웹",
    definition:
      "화면 크기에 따라 레이아웃이 유연하게 바뀌도록 만드는 방식입니다. 상대 단위와 미디어 쿼리를 사용합니다.",
    aliases: ["responsive web", "미디어 쿼리", "media query"],
    category: "frontend",
    related: ["accessibility"],
    created_at: CREATED_AT,
  },
  {
    id: "xss",
    term: "XSS",
    definition:
      "악성 스크립트를 페이지에 삽입해 다른 사용자의 브라우저에서 실행시키는 공격입니다. 출력 이스케이프와 CSP로 막습니다.",
    aliases: ["Cross-Site Scripting", "크로스 사이트 스크립팅"],
    category: "frontend",
    related: ["csrf", "same-origin-policy"],
    created_at: CREATED_AT,
  },
  {
    id: "csrf",
    term: "CSRF",
    definition:
      "인증된 사용자의 브라우저가 의도치 않은 요청을 보내게 만드는 공격입니다. 토큰과 SameSite 쿠키로 막습니다.",
    aliases: ["Cross-Site Request Forgery", "사이트 간 요청 위조"],
    category: "frontend",
    related: ["xss", "cookie"],
    created_at: CREATED_AT,
  },
  {
    id: "cookie",
    term: "쿠키",
    definition:
      "브라우저가 저장하고 요청마다 자동으로 보내는 작은 데이터입니다. 만료와 HttpOnly, Secure 속성을 설정할 수 있습니다.",
    aliases: ["cookie", "localStorage", "sessionStorage"],
    category: "frontend",
    related: ["session", "csrf"],
    created_at: CREATED_AT,
  },
  {
    id: "api",
    term: "API",
    definition:
      "프로그램끼리 기능을 주고받기 위해 약속한 인터페이스입니다. 웹에서는 주로 HTTP로 자원을 요청하고 응답받습니다.",
    aliases: ["Application Programming Interface"],
    category: "backend",
    related: ["rest", "api-versioning"],
    created_at: CREATED_AT,
  },
  {
    id: "middleware",
    term: "미들웨어",
    definition:
      "요청과 응답 사이에서 공통 처리를 담당하는 계층입니다. 인증 확인, 로깅, 리다이렉션 같은 작업을 처리합니다.",
    aliases: ["middleware"],
    category: "backend",
    related: ["authentication", "logging"],
    created_at: CREATED_AT,
  },
  {
    id: "authentication",
    term: "인증",
    definition:
      "요청한 주체가 누구인지 확인하는 과정입니다. 로그인이 대표적이며 인가와는 구분됩니다.",
    aliases: ["authentication", "authn"],
    category: "backend",
    related: ["authorization", "jwt", "session"],
    created_at: CREATED_AT,
  },
  {
    id: "authorization",
    term: "인가",
    definition:
      "인증된 주체가 특정 자원에 접근할 권한이 있는지 판단하는 과정입니다. 반드시 서버에서 확인해야 합니다.",
    aliases: ["authorization", "authz", "권한"],
    category: "backend",
    related: ["authentication", "rls"],
    created_at: CREATED_AT,
  },
  {
    id: "jwt",
    term: "JWT",
    definition:
      "서명된 토큰에 사용자 정보를 담아 주고받는 인증 방식입니다. 서버가 상태를 두지 않아 확장에 유리하지만 강제 무효화가 어렵습니다.",
    aliases: ["JSON Web Token"],
    category: "backend",
    related: ["authentication", "session"],
    created_at: CREATED_AT,
  },
  {
    id: "session",
    term: "세션",
    definition:
      "서버가 로그인 상태를 저장하고 클라이언트는 식별자만 갖는 인증 방식입니다. 즉시 무효화할 수 있지만 저장소가 필요합니다.",
    aliases: ["session"],
    category: "backend",
    related: ["cookie", "jwt", "authentication"],
    created_at: CREATED_AT,
  },
  {
    id: "idempotency",
    term: "멱등성",
    definition:
      "같은 요청을 여러 번 보내도 결과 상태가 같은 성질입니다. 재시도로 결제나 주문이 중복 처리되지 않게 하는 근거가 됩니다.",
    aliases: ["idempotency", "idempotent"],
    category: "backend",
    related: ["rest", "message-queue"],
    created_at: CREATED_AT,
  },
  {
    id: "rate-limiting",
    term: "요청 제한",
    definition:
      "일정 시간 안에 허용할 요청 수를 제한해 남용을 막는 기법입니다. 토큰 버킷이나 슬라이딩 윈도우로 구현합니다.",
    aliases: ["rate limiting", "레이트 리미팅", "스로틀링"],
    category: "backend",
    related: ["api", "cache"],
    created_at: CREATED_AT,
  },
  {
    id: "cache",
    term: "캐시",
    definition:
      "자주 쓰는 데이터를 빠른 저장소에 두고 재사용하는 기법입니다. 만료와 무효화 시점을 정하지 않으면 오래된 값이 남습니다.",
    aliases: ["cache", "캐싱", "TTL"],
    category: "backend",
    related: ["cdn", "state-management", "rate-limiting"],
    created_at: CREATED_AT,
  },
  {
    id: "message-queue",
    term: "메시지 큐",
    definition:
      "생산자와 소비자를 분리해 비동기로 작업을 전달하는 구조입니다. 트래픽 완충 역할을 하며 중복 수신에 대비해야 합니다.",
    aliases: ["message queue", "MQ", "큐잉"],
    category: "backend",
    related: ["queue", "idempotency", "batch"],
    created_at: CREATED_AT,
  },
  {
    id: "webhook",
    term: "웹훅",
    definition:
      "이벤트가 발생하면 서버가 미리 등록된 URL로 요청을 보내는 방식입니다. 폴링 없이 변화를 전달받을 수 있습니다.",
    aliases: ["webhook"],
    category: "backend",
    related: ["api", "message-queue"],
    created_at: CREATED_AT,
  },
  {
    id: "batch",
    term: "배치 작업",
    definition:
      "정해진 주기에 대량의 데이터를 한꺼번에 처리하는 작업입니다. 단일 실행 보장과 재시도, 중단 후 재개를 설계해야 합니다.",
    aliases: ["batch", "cron", "스케줄링"],
    category: "backend",
    related: ["message-queue", "idempotency"],
    created_at: CREATED_AT,
  },
  {
    id: "logging",
    term: "로깅",
    definition:
      "실행 중 발생한 사건을 기록해 원인 추적에 사용하는 활동입니다. 토큰이나 개인정보는 남기지 않습니다.",
    aliases: ["logging", "로그"],
    category: "backend",
    related: ["observability", "middleware"],
    created_at: CREATED_AT,
  },
  {
    id: "api-versioning",
    term: "API 버전 관리",
    definition:
      "호환성을 깨는 변경이 생길 때 새 버전으로 분리해 기존 클라이언트를 보호하는 방식입니다. 폐기 일정을 함께 공지합니다.",
    aliases: ["API versioning", "버저닝"],
    category: "backend",
    related: ["api", "semantic-versioning"],
    created_at: CREATED_AT,
  },
  {
    id: "environment-variable",
    term: "환경 변수",
    definition:
      "코드 바깥에서 주입하는 설정값입니다. 비밀 키처럼 저장소에 올리면 안 되는 값을 분리하는 데 사용합니다.",
    aliases: ["environment variable", "env"],
    category: "backend",
    related: ["ci-cd"],
    created_at: CREATED_AT,
  },
  {
    id: "sql-injection",
    term: "SQL 인젝션",
    definition:
      "입력값이 쿼리 구조를 바꾸도록 조작하는 공격입니다. 파라미터화된 쿼리를 사용하면 근본적으로 막을 수 있습니다.",
    aliases: ["SQL Injection"],
    category: "backend",
    related: ["query-plan", "authorization"],
    created_at: CREATED_AT,
  },
  {
    id: "horizontal-scaling",
    term: "수평 확장",
    definition:
      "서버 대수를 늘려 처리량을 키우는 방식입니다. 상태를 공유하지 않는 설계와 로드 밸런싱이 전제입니다.",
    aliases: ["horizontal scaling", "스케일 아웃", "scale out", "수직 확장"],
    category: "system_design",
    related: ["load-balancer", "sharding", "stateless"],
    created_at: CREATED_AT,
  },
  {
    id: "stateless",
    term: "무상태",
    definition:
      "서버가 요청 사이의 상태를 보관하지 않는 설계입니다. 어느 서버가 처리해도 결과가 같아 수평 확장이 쉬워집니다.",
    aliases: ["stateless", "무상태 설계"],
    category: "system_design",
    related: ["horizontal-scaling", "session"],
    created_at: CREATED_AT,
  },
  {
    id: "microservices",
    term: "마이크로서비스",
    definition:
      "기능을 독립 배포 가능한 작은 서비스로 나누는 아키텍처입니다. 확장은 유연하지만 분산 트랜잭션과 운영 비용이 늘어납니다.",
    aliases: ["microservices", "MSA", "모놀리식", "monolithic"],
    category: "system_design",
    related: ["message-queue", "observability"],
    created_at: CREATED_AT,
  },
  {
    id: "cap-theorem",
    term: "CAP 정리",
    definition:
      "분산 시스템이 일관성, 가용성, 분할 내성을 동시에 만족할 수 없다는 정리입니다. 분할이 생겼을 때 무엇을 지킬지 선택하게 됩니다.",
    aliases: ["CAP theorem"],
    category: "system_design",
    related: ["eventual-consistency", "replica"],
    created_at: CREATED_AT,
  },
  {
    id: "eventual-consistency",
    term: "최종 일관성",
    definition:
      "일시적으로 노드마다 값이 다를 수 있지만 시간이 지나면 같아지는 일관성 모델입니다. 가용성과 확장성에 유리합니다.",
    aliases: ["eventual consistency", "강한 일관성"],
    category: "system_design",
    related: ["cap-theorem", "replica"],
    created_at: CREATED_AT,
  },
  {
    id: "circuit-breaker",
    term: "서킷 브레이커",
    definition:
      "장애가 난 외부 호출을 일정 시간 차단해 연쇄 실패를 막는 패턴입니다. 회복을 확인하면 다시 열립니다.",
    aliases: ["circuit breaker"],
    category: "system_design",
    related: ["microservices", "observability"],
    created_at: CREATED_AT,
  },
  {
    id: "blue-green-deployment",
    term: "블루-그린 배포",
    definition:
      "동일한 두 환경을 두고 트래픽을 전환해 무중단 배포와 빠른 롤백을 지원하는 방식입니다.",
    aliases: ["blue-green deployment", "카나리 배포", "canary", "롤링 배포"],
    category: "system_design",
    related: ["ci-cd", "semantic-versioning"],
    created_at: CREATED_AT,
  },
  {
    id: "ci-cd",
    term: "CI/CD",
    definition:
      "변경을 자주 통합해 자동 검증하고, 검증된 결과를 자동으로 배포하는 방식입니다. 통합 위험과 배포 부담을 줄입니다.",
    aliases: ["지속적 통합", "지속적 배포", "continuous integration"],
    category: "system_design",
    related: ["blue-green-deployment", "iac", "environment-variable"],
    created_at: CREATED_AT,
  },
  {
    id: "iac",
    term: "IaC",
    definition:
      "인프라 구성을 코드로 관리해 같은 환경을 재현할 수 있게 하는 방식입니다. 버전 관리와 리뷰가 가능해집니다.",
    aliases: ["Infrastructure as Code", "코드형 인프라"],
    category: "system_design",
    related: ["ci-cd", "container"],
    created_at: CREATED_AT,
  },
  {
    id: "container",
    term: "컨테이너",
    definition:
      "애플리케이션과 실행 환경을 함께 묶어 격리해 실행하는 단위입니다. 호스트 커널을 공유해 가상 머신보다 가볍습니다.",
    aliases: ["container", "Docker", "도커"],
    category: "system_design",
    related: ["orchestration", "iac"],
    created_at: CREATED_AT,
  },
  {
    id: "orchestration",
    term: "컨테이너 오케스트레이션",
    definition:
      "여러 컨테이너의 배치, 확장, 복구를 자동으로 관리하는 것입니다. 쿠버네티스가 대표적인 도구입니다.",
    aliases: ["orchestration", "Kubernetes", "쿠버네티스", "k8s"],
    category: "system_design",
    related: ["container", "horizontal-scaling"],
    created_at: CREATED_AT,
  },
  {
    id: "serverless",
    term: "서버리스",
    definition:
      "요청이 있을 때만 함수가 실행되고 사용한 만큼 과금되는 실행 모델입니다. 서버 운영과 패치를 제공자가 담당합니다.",
    aliases: ["serverless", "FaaS"],
    category: "system_design",
    related: ["container", "auto-scaling"],
    created_at: CREATED_AT,
  },
  {
    id: "auto-scaling",
    term: "오토스케일링",
    definition:
      "부하 지표에 따라 인스턴스 수를 자동으로 늘리거나 줄이는 기능입니다. 성능과 비용의 균형을 맞춥니다.",
    aliases: ["auto scaling", "자동 확장"],
    category: "system_design",
    related: ["horizontal-scaling", "load-balancer", "serverless"],
    created_at: CREATED_AT,
  },
  {
    id: "observability",
    term: "관측 가능성",
    definition:
      "로그, 지표, 추적으로 시스템 내부 상태를 밖에서 파악할 수 있는 정도입니다. 장애 원인 추적의 기반이 됩니다.",
    aliases: ["observability", "모니터링", "monitoring", "분산 추적"],
    category: "system_design",
    related: ["logging", "circuit-breaker", "sla"],
    created_at: CREATED_AT,
  },
  {
    id: "sla",
    term: "SLA와 SLO",
    definition:
      "SLA는 사용자와 약속한 서비스 수준, SLO는 내부적으로 목표하는 수준입니다. 가용성이나 응답 시간 같은 지표로 정합니다.",
    aliases: ["SLA", "SLO", "가용성"],
    category: "system_design",
    related: ["observability"],
    created_at: CREATED_AT,
  },
  {
    id: "semantic-versioning",
    term: "시맨틱 버저닝",
    definition:
      "MAJOR.MINOR.PATCH 형식으로 버전을 매기는 규칙입니다. 호환성을 깨면 MAJOR, 호환되는 기능 추가는 MINOR, 버그 수정은 PATCH를 올립니다.",
    aliases: ["Semantic Versioning", "SemVer"],
    category: "system_design",
    related: ["api-versioning", "ci-cd"],
    created_at: CREATED_AT,
  },
];
