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
    detail:
      "인터넷에서 데이터를 정확하게 전달하기 위해 쓰는 전송 계층 프로토콜이다. 통신 전에 3-way handshake로 연결을 맺고, 데이터를 세그먼트로 나눠 순서 번호를 붙여 보낸다. 받은 쪽이 확인 응답을 보내지 않으면 다시 전송하고, 수신자의 처리 속도에 맞추는 흐름 제어와 네트워크 혼잡을 피하는 혼잡 제어도 수행한다. 이런 절차 때문에 UDP보다 느리지만, 웹·파일 전송·메일처럼 데이터가 빠지면 안 되는 통신에서는 사실상 기본으로 쓰인다.",
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
    detail:
      "연결을 맺지 않고 데이터그램을 그대로 보내는 전송 계층 프로토콜이다. 순서 보장, 재전송, 흐름 제어가 없어 헤더가 작고 지연이 짧다. 패킷이 유실되거나 순서가 뒤바뀌어도 프로토콜 차원에서 복구하지 않으므로, 필요하면 응용 계층이 직접 처리해야 한다. 실시간 스트리밍, 음성 통화, 게임처럼 약간의 손실보다 지연이 더 치명적인 통신에 적합하다.",
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
    detail:
      "TCP가 연결을 수립할 때 세 번의 패킷을 주고받는 절차다. 클라이언트가 SYN으로 연결을 요청하며 자신의 초기 시퀀스 번호를 알리고, 서버가 SYN-ACK로 응답하며 자신의 번호를 함께 보낸다. 마지막으로 클라이언트가 ACK를 보내면 양쪽이 서로의 시작 번호와 수신 가능 상태를 확인한 상태가 된다. 연결을 끊을 때는 FIN과 ACK를 각각 주고받는 4-way handshake를 사용한다.",
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
    detail:
      "웹에서 클라이언트와 서버가 자원을 주고받기 위해 쓰는 응용 계층 프로토콜이다. 요청은 메서드(GET, POST 등)와 경로, 헤더, 본문으로 구성되고 응답에는 상태 코드가 담겨 결과의 의미를 알린다. 서버가 이전 요청을 기억하지 않는 무상태 구조라, 로그인 상태 같은 정보는 쿠키나 토큰으로 매 요청에 실어 보낸다. 버전이 올라가며 연결 재사용과 멀티플렉싱이 더해져 성능이 개선돼 왔다.",
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
    detail:
      "HTTP 통신을 TLS로 감싸 암호화한 방식이다. 접속 시 서버가 인증서를 제시하고 브라우저가 신뢰할 수 있는 기관이 발급했는지 확인한 뒤, 핸드셰이크로 교환한 대칭키로 이후 통신을 암호화한다. 이를 통해 중간에서 내용을 엿보거나 바꾸는 것을 막고 접속 대상이 진짜인지 확인할 수 있다. 기본 포트는 443이며, 오늘날 대부분의 브라우저 기능은 HTTPS 환경을 전제로 동작한다.",
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
    detail:
      "네트워크 구간에서 데이터를 암호화하고 통신 상대를 인증하는 보안 프로토콜이다. 핸드셰이크 단계에서 서버 인증서를 검증하고 사용할 암호 방식을 합의한 뒤, 그 과정에서 만든 대칭키로 실제 데이터를 암호화한다. 공개키 암호는 키를 안전하게 교환하는 데만 쓰고 본문은 빠른 대칭키로 처리해 성능과 안전성을 함께 잡는다. 과거 이름인 SSL로도 불리지만 SSL 자체는 취약점 때문에 더 이상 사용하지 않는다.",
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
    detail:
      "사람이 읽는 도메인 이름을 실제 통신에 필요한 IP 주소로 바꿔주는 분산 데이터베이스 시스템이다. 조회는 브라우저와 운영체제 캐시를 먼저 확인하고, 없으면 로컬 DNS 서버가 루트 서버, TLD 서버, 권한 있는 네임서버를 차례로 물어 답을 찾는다. 각 응답은 TTL 동안 캐시돼 같은 조회를 반복하지 않는다. 도메인의 IP를 바꿔도 캐시가 만료될 때까지 이전 주소로 접속될 수 있다는 점을 고려해야 한다.",
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
    detail:
      "네트워크에 연결된 장치를 식별하고 패킷을 목적지까지 라우팅하기 위해 부여하는 주소다. IPv4는 32비트로 약 43억 개를 표현할 수 있어 고갈 문제가 있고, 이를 해결하기 위해 128비트의 IPv6가 도입됐다. 공인 IP는 인터넷에서 유일하지만 사설 IP는 내부망에서만 쓰이며 NAT를 통해 외부와 통신한다. 한 장치가 여러 서비스를 제공할 때는 포트 번호로 구분한다.",
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
    detail:
      "한 장치 안에서 통신할 프로그램을 구분하기 위한 16비트 번호다. IP 주소가 건물 주소라면 포트는 호실 번호에 해당해, 같은 서버에서 웹과 데이터베이스가 동시에 서비스될 수 있게 한다. 0~1023은 잘 알려진 포트로 HTTP 80, HTTPS 443, SSH 22처럼 용도가 관례로 정해져 있다. 방화벽은 보통 포트 단위로 접근을 허용하거나 차단한다.",
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
    detail:
      "여러 서버 앞에서 들어오는 요청을 나눠 보내는 구성 요소다. 라운드 로빈, 최소 연결, 해시 기반 등 정책에 따라 대상 서버를 고르고, 주기적인 헬스 체크로 응답하지 않는 서버를 자동으로 제외한다. 덕분에 한 서버가 죽어도 서비스가 이어지고, 서버를 추가하는 것만으로 처리량을 늘릴 수 있다. 세션을 서버 메모리에 두면 같은 사용자를 같은 서버로 보내야 하므로, 세션을 외부 저장소로 분리하는 편이 확장에 유리하다.",
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
    detail:
      "정적 콘텐츠를 전 세계 엣지 서버에 캐시해 사용자와 가까운 위치에서 전달하는 네트워크 서비스다. 이미지, 스크립트, 동영상처럼 자주 요청되고 잘 바뀌지 않는 파일을 원본 서버 대신 응답해 지연을 줄이고 트래픽 비용을 낮춘다. 파일을 갱신했는데 이전 버전이 계속 나가는 것을 막기 위해 파일명에 해시를 넣거나 캐시 무효화를 요청한다. 최근에는 엣지에서 간단한 로직을 실행하는 기능도 함께 제공한다.",
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
    detail:
      "클라이언트와 서버 사이에서 요청을 중계하는 서버다. 클라이언트 쪽에 두는 포워드 프록시는 내부 사용자의 외부 접근을 통제하거나 캐싱하는 데 쓰이고, 서버 앞에 두는 리버스 프록시는 부하 분산, TLS 종료, 캐싱, 접근 제어를 담당한다. 웹 서비스에서 말하는 프록시는 대개 리버스 프록시를 가리킨다. 중계 지점이 하나 늘어나므로 장애 지점과 지연도 함께 고려해야 한다.",
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
    detail:
      "한 번 연결을 맺으면 서버와 클라이언트가 서로 자유롭게 메시지를 보낼 수 있는 양방향 통신 프로토콜이다. HTTP 요청으로 시작해 업그레이드 과정을 거쳐 전환되며, 이후에는 요청·응답 구조에 얽매이지 않는다. 서버가 변화를 즉시 밀어줄 수 있어 채팅, 실시간 알림, 협업 편집에 적합하다. 연결이 유지되는 만큼 서버 자원을 점유하므로 연결 수 관리와 재연결 전략이 필요하다.",
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
    detail:
      "HTTP의 기존 규칙을 그대로 활용해 API를 설계하는 방식이다. 자원을 URI로 표현하고 행위는 HTTP 메서드로 나타내며, 결과는 상태 코드로 알린다. 서버가 클라이언트 상태를 저장하지 않는 무상태성, 응답을 캐시할 수 있게 하는 캐시 가능성, 중간 계층을 둘 수 있는 계층형 구조가 대표적인 제약이다. 규칙을 지키면 별도 문서 없이도 동작을 예측하기 쉬워지지만, 화면에 필요한 데이터가 여러 자원에 흩어지면 요청 수가 늘어나는 단점이 있다.",
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
    detail:
      "브라우저가 다른 출처의 응답을 읽어도 되는지 서버가 헤더로 알려주는 규약이다. 브라우저는 기본적으로 동일 출처 정책에 따라 다른 출처의 응답 내용에 접근하지 못하게 막는데, 서버가 Access-Control-Allow-Origin으로 허용 출처를 밝히면 예외가 된다. 특정 메서드나 헤더를 쓰는 요청은 실제 요청 전에 OPTIONS 프리플라이트로 허용 여부를 먼저 확인한다. 브라우저에서만 적용되는 정책이라 서버 간 통신에는 영향을 주지 않는다.",
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
    detail:
      "프로토콜, 호스트, 포트가 모두 같아야 다른 문서의 자원에 접근할 수 있게 제한하는 브라우저의 기본 보안 정책이다. 이 정책이 없으면 임의의 사이트가 스크립트로 다른 사이트의 응답이나 쿠키를 읽어갈 수 있다. 이미지나 스크립트처럼 불러오기는 허용되지만 내용을 읽는 것은 막히는 식으로 동작이 나뉜다. 정상적인 교차 출처 통신이 필요할 때는 CORS로 서버가 명시적으로 허용해야 한다.",
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
    detail:
      "실행 중인 프로그램을 운영체제가 관리하는 단위다. 각 프로세스는 독립된 가상 주소 공간과 파일 디스크립터, 권한 정보를 가지며 다른 프로세스의 메모리를 직접 읽을 수 없다. 이 격리 덕분에 한 프로그램이 잘못돼도 다른 프로그램에 영향을 주지 않지만, 서로 데이터를 주고받으려면 파이프나 소켓 같은 별도 통신 수단이 필요하다. 생성과 전환 비용이 스레드보다 크다.",
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
    detail:
      "프로세스 안에서 실제로 명령을 실행하는 흐름의 단위다. 같은 프로세스의 스레드끼리는 코드, 전역 데이터, 힙을 공유하고 스택과 레지스터, 프로그램 카운터만 각자 갖는다. 공유 덕분에 통신이 쉽고 전환 비용이 적지만, 같은 데이터에 동시에 접근하면 값이 깨질 수 있어 잠금이나 원자적 연산으로 동기화해야 한다. 스레드 하나가 비정상 종료하면 프로세스 전체가 영향을 받을 수 있다.",
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
    detail:
      "CPU가 실행하던 작업을 멈추고 다른 작업으로 넘어갈 때 상태를 저장하고 복원하는 과정이다. 현재 레지스터 값과 프로그램 카운터 등을 제어 블록에 저장하고, 다음 작업의 저장된 상태를 불러와 이어서 실행한다. 저장·복원 자체의 비용보다도 캐시와 TLB에 쌓아둔 내용이 무효화돼 이후 메모리 접근이 느려지는 간접 비용이 크다. 스레드 간 전환은 주소 공간을 공유해 프로세스 간 전환보다 저렴하다.",
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
    detail:
      "둘 이상의 작업이 서로가 점유한 자원을 기다리며 영원히 진행하지 못하는 상태다. 상호 배제, 점유와 대기, 비선점, 순환 대기 네 조건이 동시에 성립할 때 발생한다. 예방은 이 중 하나를 깨뜨리는 방식으로, 모든 작업이 자원을 정해진 순서로만 요청하게 해 순환 대기를 없애는 방법이 실무에서 가장 흔하다. 그 밖에 자원 할당을 미리 검사하는 회피, 주기적으로 탐지해 일부 작업을 취소하는 복구 전략이 있다.",
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
    detail:
      "임계 구역에 한 번에 하나의 스레드만 들어가도록 보장하는 잠금 장치다. 잠근 주체만 해제할 수 있는 소유 개념이 있어, 다른 스레드가 임의로 풀 수 없다. 잠금을 얻지 못한 스레드는 대기하거나 잠시 회전하며 기다린다. 여러 잠금을 중첩해 사용할 때는 획득 순서를 통일하지 않으면 교착 상태가 생길 수 있다.",
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
    detail:
      "동시에 접근할 수 있는 자원의 개수를 정수 카운터로 제어하는 동기화 도구다. 획득하면 카운터가 줄고 해제하면 늘어나며, 0이 되면 이후 요청은 대기한다. 소유 개념이 없어 A 스레드가 획득한 것을 B 스레드가 해제할 수 있고, 이 성질을 이용해 작업 순서를 알리는 신호로도 쓴다. 카운터가 1인 이진 세마포어는 뮤텍스와 비슷해 보이지만 소유 개념이 없다는 점이 다르다.",
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
    detail:
      "여러 실행 흐름이 공유 자원에 접근하는 코드 구간이다. 이 구간이 동시에 실행되면 읽고 쓰는 순서가 뒤엉켜 값이 손실되거나 깨질 수 있다. 그래서 잠금이나 원자적 연산으로 한 번에 하나만 들어가도록 보호한다. 구간을 넓게 잡으면 안전하지만 동시성이 떨어지므로, 꼭 필요한 범위만 감싸는 것이 좋다.",
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
    detail:
      "여러 실행 흐름의 실행 순서에 따라 결과가 달라지는 상황이다. 값을 읽고 계산해 다시 쓰는 동안 다른 흐름이 끼어들면 한쪽의 변경이 사라지는 갱신 손실이 대표적이다. 재현이 간헐적이라 디버깅이 어렵고, 테스트를 통과했다고 없다고 단정할 수 없다. 잠금이나 원자적 연산, 데이터베이스라면 조건부 갱신이나 락으로 막는다.",
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
    detail:
      "프로세스마다 연속된 가상 주소 공간을 제공하고 이를 실제 물리 메모리와 분리하는 기법이다. 프로그램은 물리 메모리의 실제 위치를 몰라도 되고, 운영체제는 필요한 부분만 메모리에 올려 물리 메모리보다 큰 프로그램도 실행할 수 있다. 주소 변환은 페이지 테이블로 이뤄지고 자주 쓰는 변환은 TLB에 캐시된다. 프로세스 간 메모리 격리도 이 구조 위에서 이뤄진다.",
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
    detail:
      "가상 주소 공간을 고정 크기 페이지로 나누고 물리 메모리의 프레임에 매핑하는 방식이다. 페이지 단위로 관리하므로 연속된 빈 공간을 찾을 필요가 없어 외부 단편화가 생기지 않는다. 대신 페이지 안에서 쓰지 않는 공간이 남는 내부 단편화가 발생한다. 매핑 정보는 페이지 테이블에 저장되며, 매번 테이블을 조회하면 느리기 때문에 TLB라는 전용 캐시를 둔다.",
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
    detail:
      "접근하려는 페이지가 물리 메모리에 없을 때 발생하는 예외다. 운영체제가 이를 받아 디스크에서 해당 페이지를 읽어 메모리에 올린 뒤 중단된 명령을 다시 실행한다. 필요한 페이지만 올리는 요구 페이징의 정상적인 동작이지만, 디스크 접근이 끼어들어 비용이 매우 크다. 메모리가 부족해 페이지를 올리고 내리는 일만 반복하는 상태를 스래싱이라고 한다.",
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
    detail:
      "사용자 모드에서 실행되는 프로그램이 커널의 기능을 요청하는 인터페이스다. 파일 읽기, 네트워크 전송, 프로세스 생성처럼 하드웨어나 보호된 자원에 접근하는 작업은 반드시 이 경로를 거친다. 호출하면 CPU가 커널 모드로 전환됐다가 작업을 마치고 돌아오며, 이 전환에 비용이 든다. 그래서 잦은 작은 입출력을 버퍼에 모아 한 번에 처리하는 최적화가 흔히 쓰인다.",
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
    detail:
      "운영체제의 핵심으로 하드웨어와 응용 프로그램 사이에서 자원을 관리하는 계층이다. 프로세스 스케줄링, 메모리 할당, 파일 시스템, 장치 드라이버, 네트워크 스택을 담당한다. 특권 모드에서 동작해 모든 메모리와 명령에 접근할 수 있기 때문에, 응용 프로그램은 시스템 콜을 통해서만 기능을 요청할 수 있다. 컨테이너는 이 커널을 호스트와 공유해 가상 머신보다 가볍게 동작한다.",
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
    detail:
      "실행 준비된 작업 중 다음에 CPU를 사용할 작업을 고르는 커널 구성 요소다. 도착 순서대로 처리하는 FCFS, 짧은 작업을 먼저 처리하는 SJF, 정해진 시간만큼 번갈아 실행하는 라운드 로빈 등 정책에 따라 응답성과 처리량이 달라진다. 우선순위를 두면 중요한 작업을 먼저 처리할 수 있지만 낮은 우선순위 작업이 계속 밀리는 기아가 생길 수 있어, 대기 시간에 따라 우선순위를 올리는 에이징을 함께 쓴다.",
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
    detail:
      "호출한 함수가 제어권을 언제 돌려주는지에 대한 구분이다. 블로킹은 작업이 끝날 때까지 반환하지 않아 그동안 다른 일을 할 수 없고, 논블로킹은 즉시 반환해 호출한 쪽이 다른 일을 이어서 할 수 있다. 이는 결과를 어떻게 확인하는지에 대한 동기·비동기 구분과는 별개의 축이라, 네 가지 조합이 모두 가능하다. 논블로킹 호출은 완료 여부를 반복 확인하거나 콜백·이벤트로 통보받는 방식과 함께 쓰인다.",
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
    detail:
      "조회 속도를 높이기 위해 데이터의 위치를 정렬된 별도 구조로 관리하는 것이다. 대부분의 관계형 데이터베이스는 B-Tree 계열을 사용해 탐색 범위를 절반씩 좁혀가며 O(log n)에 원하는 행을 찾는다. 대신 삽입·수정·삭제할 때마다 인덱스도 함께 갱신해야 해 쓰기가 느려지고 저장 공간을 더 쓴다. 값의 종류가 적은 컬럼이나 자주 바뀌는 컬럼에는 효과가 작으므로, 실제 조회 조건과 정렬 기준을 보고 선별해야 한다.",
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
    detail:
      "한 노드에 여러 개의 키를 담아 트리의 높이를 낮춘 균형 트리다. 디스크는 블록 단위로 읽기 때문에 노드 하나에 많은 키를 담으면 같은 데이터를 찾는 데 필요한 디스크 접근 횟수가 크게 줄어든다. 삽입과 삭제 시 노드를 분할하거나 병합해 모든 리프의 깊이를 같게 유지한다. 실무에서 쓰이는 변형인 B+Tree는 실제 데이터를 리프에만 두고 리프끼리 연결해 범위 조회에 유리하다.",
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
    detail:
      "여러 데이터 조작을 하나의 논리적 작업으로 묶은 단위다. 중간에 실패하면 전부 취소되고, 성공하면 전부 반영돼 어중간한 상태가 남지 않는다. 계좌 이체처럼 두 변경이 함께 성립해야 하는 작업에서 필수적이다. 트랜잭션 범위가 넓으면 잠금을 오래 점유해 동시성이 떨어지므로, 외부 API 호출처럼 오래 걸리는 작업은 트랜잭션 밖에서 처리하는 것이 좋다.",
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
    detail:
      "트랜잭션이 지켜야 할 네 가지 성질을 묶은 말이다. 원자성은 작업이 전부 반영되거나 전부 취소되는 것, 일관성은 트랜잭션 전후로 제약 조건이 유지되는 것, 격리성은 동시에 실행되는 트랜잭션이 서로 간섭하지 않는 것, 지속성은 커밋된 결과가 장애 이후에도 남는 것이다. 원자성과 지속성은 로그 기반 복구로, 격리성은 잠금이나 다중 버전 관리로 구현한다.",
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
    detail:
      "동시에 실행되는 트랜잭션이 서로의 변경을 얼마나 볼 수 있는지 정하는 단계다. READ UNCOMMITTED는 커밋되지 않은 값까지 읽어 더티 리드가 생기고, READ COMMITTED는 이를 막지만 같은 행을 다시 읽을 때 값이 달라질 수 있다. REPEATABLE READ는 같은 행의 재조회를 보장하되 범위 조회에서 새 행이 나타나는 팬텀 리드가 가능하고, SERIALIZABLE은 이를 모두 막는 대신 동시성이 가장 낮다. 수준을 올릴수록 안전하지만 처리량이 떨어지므로 도메인 요구사항에 맞춰 고른다.",
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
    detail:
      "같은 데이터의 여러 버전을 유지해 읽기와 쓰기가 서로를 막지 않게 하는 동시성 제어 방식이다. 트랜잭션은 시작 시점 기준의 스냅샷을 보기 때문에 다른 트랜잭션이 값을 바꾸고 있어도 기다리지 않고 읽을 수 있다. 덕분에 읽기 위주의 작업에서 처리량이 크게 올라간다. 대신 더 이상 참조되지 않는 옛 버전을 정리하는 작업이 필요하고, 이 정리가 밀리면 저장 공간과 성능에 영향을 준다.",
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
    detail:
      "트랜잭션에서 수행한 변경을 취소하고 시작 이전 상태로 되돌리는 동작이다. 오류가 발생했거나 애플리케이션이 명시적으로 요청할 때 실행되며, 데이터베이스는 변경 전 값을 기록한 로그를 이용해 복원한다. 반대로 변경을 확정하는 것이 커밋이며, 커밋된 이후에는 롤백할 수 없다. 중첩된 트랜잭션에서는 전파 설정에 따라 어디까지 되돌릴지가 달라지므로 확인이 필요하다.",
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
    detail:
      "중복을 제거해 삽입·갱신·삭제 시 생기는 이상 현상을 막는 데이터베이스 설계 과정이다. 한 사실이 한 곳에만 저장되게 테이블을 나누므로 값을 고칠 때 여러 곳을 함께 바꿀 필요가 없다. 대신 테이블이 잘게 나뉘어 조회할 때 조인이 늘고 성능이 떨어질 수 있다. 읽기가 압도적으로 많고 조인이 병목이라면 의도적으로 중복을 허용하는 반정규화를 선택하되, 중복 데이터를 동기화할 책임이 생긴다는 점을 감수해야 한다.",
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
    detail:
      "테이블에서 각 행을 유일하게 식별하는 컬럼이나 컬럼 조합이다. 중복과 NULL을 허용하지 않으며 대부분의 데이터베이스가 자동으로 인덱스를 만든다. 업무 의미가 있는 값을 그대로 쓰는 자연 키는 값이 바뀔 위험이 있어, 의미 없는 일련번호나 UUID를 쓰는 대리 키가 흔히 사용된다. 다른 테이블이 이 값을 외래 키로 참조하므로 한 번 정하면 바꾸기 어렵다.",
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
    detail:
      "다른 테이블의 기본 키를 참조하는 컬럼이다. 참조 대상에 없는 값이 저장되는 것을 데이터베이스가 막아주기 때문에 고아 데이터가 생기지 않는다. 참조된 행을 지울 때의 동작도 함께 정의할 수 있어, 함께 삭제하거나 NULL로 바꾸거나 삭제를 거부하게 만들 수 있다. 제약이 있는 만큼 대량 삽입이나 삭제 시 검사 비용이 든다.",
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
    detail:
      "여러 테이블의 행을 조건에 따라 연결해 하나의 결과로 만드는 연산이다. INNER JOIN은 양쪽에 모두 있는 행만 남기고, LEFT JOIN은 왼쪽 테이블을 모두 유지하며 짝이 없으면 NULL로 채운다. FULL OUTER JOIN은 양쪽을 모두 유지하고, CROSS JOIN은 모든 조합을 만들어 결과가 급격히 커진다. 조인 순서와 인덱스 유무에 따라 성능 차이가 크므로 실행 계획을 확인하는 것이 좋다.",
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
    detail:
      "충돌이 드물다고 보고 데이터를 잠그지 않은 채 진행하다가, 저장 시점에 다른 트랜잭션이 먼저 바꿨는지 확인하는 방식이다. 보통 버전 컬럼이나 타임스탬프를 두고 갱신 조건에 포함시켜, 값이 달라졌으면 갱신이 실패하도록 만든다. 실패하면 다시 읽어 재시도한다. 대기가 없어 동시성이 높지만 충돌이 잦은 자원에서는 재시도가 반복돼 오히려 비효율적이라, 그럴 때는 비관적 락이 낫다.",
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
    detail:
      "데이터베이스 연결을 미리 만들어 두고 요청마다 빌려 쓰고 반납하는 구조다. 연결 생성에는 TCP 연결과 인증이 포함돼 비용이 크기 때문에 재사용하면 응답이 크게 빨라진다. 동시에 열 수 있는 연결 수의 상한 역할도 해 데이터베이스가 과부하되는 것을 막는다. 풀이 너무 작으면 대기가 생기고 너무 크면 데이터베이스가 흔들리므로, 서버 인스턴스 수와 데이터베이스 최대 연결 수를 함께 계산해 정한다.",
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
    detail:
      "데이터를 특정 기준으로 나눠 여러 노드에 분산 저장하는 방식이다. 노드마다 데이터의 일부만 가지므로 쓰기 처리량과 저장 용량을 함께 늘릴 수 있다. 어떤 값을 기준으로 나눌지 정하는 샤드 키 선택이 핵심이며, 잘못 고르면 특정 노드에 부하가 몰린다. 여러 샤드를 걸치는 조회나 트랜잭션이 어려워지고 나중에 샤드를 재분배하는 작업도 까다롭다.",
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
    detail:
      "원본 데이터베이스의 내용을 다른 노드에 복제해 두는 구조다. 읽기 요청을 복제본으로 분산해 원본 부하를 줄이고, 장애가 나면 복제본으로 승격해 가용성을 확보할 수 있다. 복제는 보통 비동기라 원본에 쓴 직후 복제본을 읽으면 이전 값이 보이는 복제 지연이 발생한다. 방금 쓴 데이터를 즉시 읽어야 하는 화면은 원본에서 읽는 등 일관성 전략을 따로 정해야 한다.",
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
    detail:
      "객체와 관계형 데이터베이스의 테이블을 매핑해 SQL을 직접 쓰지 않고 데이터를 다루게 해주는 도구다. 반복적인 조회·저장 코드를 줄이고 타입 안정성을 얻을 수 있다. 다만 편의 메서드 뒤에서 실제로 어떤 쿼리가 나가는지 보이지 않아 N+1 문제나 불필요한 컬럼 조회가 생기기 쉽다. 성능이 중요한 구간에서는 발생 쿼리를 로그로 확인하고 필요하면 직접 작성한 쿼리를 사용한다.",
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
    detail:
      "목록을 한 번 조회한 뒤 각 항목의 연관 데이터를 개별 쿼리로 가져와, 전체 쿼리 수가 항목 수에 비례해 늘어나는 문제다. 목록이 10건이면 11번, 100건이면 101번의 쿼리가 나가 응답 시간이 급격히 나빠진다. 조인으로 한 번에 가져오거나, 연관 id를 모아 IN 절로 일괄 조회하는 방식으로 해결한다. ORM을 쓸 때 특히 자주 발생하므로 지연 로딩 설정과 실제 쿼리 로그를 함께 확인해야 한다.",
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
    detail:
      "데이터베이스가 쿼리를 어떤 순서와 방법으로 처리할지 보여주는 정보다. 인덱스를 탔는지 전체를 훑었는지, 조인 순서와 방식은 무엇인지, 예상 처리 행 수는 얼마인지를 확인할 수 있다. 느린 쿼리를 만나면 추측하기 전에 이 계획부터 확인하는 것이 원칙이다. 함수로 감싼 조건이나 형 변환 때문에 인덱스를 못 타는 경우가 흔한데, 계획을 보면 바로 드러난다.",
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
    detail:
      "데이터베이스 스키마 변경을 파일로 관리하고 순서대로 적용하는 방식이다. 변경 이력이 코드와 함께 버전 관리돼 어떤 환경에 무엇이 적용됐는지 추적할 수 있다. 이미 적용된 파일을 고쳐 다시 실행하기를 기대하면 안 되고, 보정이 필요하면 더 늦은 시각의 새 파일을 추가한다. 파일을 만드는 것과 운영 데이터베이스에 실제로 적용하는 것은 별개의 작업이라는 점을 항상 구분해야 한다.",
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
    detail:
      "테이블의 행 단위로 접근 권한을 제어하는 데이터베이스 보안 기능이다. 정책을 걸어두면 조회·삽입·수정·삭제 각각에 대해 어떤 행을 다룰 수 있는지 데이터베이스가 직접 판단한다. 애플리케이션이 조건을 빠뜨려도 다른 사용자의 데이터가 노출되지 않아, 방어선을 한 겹 더 두는 효과가 있다. 정책이 매 쿼리에 적용되므로 조건이 인덱스를 타도록 설계하는 것이 좋다.",
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
    detail:
      "입력 크기가 커질 때 알고리즘의 연산 횟수나 메모리 사용량이 어떤 추세로 늘어나는지 나타내는 표기법이다. 상수 계수와 낮은 차수 항을 무시하고 가장 크게 자라는 항만 남겨 상한을 표현한다. O(1), O(log n), O(n), O(n log n), O(n²) 순으로 나빠지며, 입력이 작을 때는 상수 계수나 캐시 특성이 더 큰 영향을 주기도 한다. 알고리즘을 비교할 때 규모가 커질수록 벌어지는 차이를 가늠하는 기준으로 쓴다.",
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
    detail:
      "같은 종류의 값을 연속된 메모리에 나열한 자료 구조다. 시작 주소에 인덱스를 더해 위치를 바로 계산할 수 있어 임의 접근이 O(1)이고, 데이터가 붙어 있어 캐시 효율도 좋다. 반면 중간에 값을 넣거나 빼려면 뒤쪽 원소를 모두 밀어야 해 O(n)이 든다. 크기가 고정된 언어에서는 공간이 부족하면 더 큰 배열을 만들어 복사해야 한다.",
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
    detail:
      "각 노드가 다음 노드의 주소를 가리키며 이어지는 자료 구조다. 삽입·삭제할 위치를 이미 알고 있다면 포인터만 바꾸면 되므로 O(1)에 처리된다. 대신 n번째 원소에 접근하려면 앞에서부터 따라가야 해 O(n)이고, 노드가 메모리에 흩어져 있어 캐시 효율이 나쁘다. 포인터를 저장할 추가 공간도 필요하다.",
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
    detail:
      "마지막에 넣은 값을 가장 먼저 꺼내는 후입선출 구조다. 넣기와 꺼내기가 한쪽 끝에서만 일어나 구현이 단순하고 두 연산 모두 O(1)이다. 함수 호출 정보를 쌓는 호출 스택, 실행 취소 기능, 괄호 짝 검사, 깊이 우선 탐색에 쓰인다. 재귀 호출이 깊어지면 호출 스택이 넘쳐 오류가 나는데 이것이 스택 오버플로다.",
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
    detail:
      "먼저 넣은 값을 먼저 꺼내는 선입선출 구조다. 한쪽 끝에서 넣고 반대쪽에서 꺼내며 두 연산 모두 O(1)이다. 작업 대기열, 요청 버퍼, 너비 우선 탐색처럼 도착 순서를 지켜야 하는 곳에 쓰인다. 양쪽에서 넣고 뺄 수 있는 덱, 우선순위가 높은 것을 먼저 꺼내는 우선순위 큐 같은 변형이 있다.",
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
    detail:
      "키를 해시 함수로 변환해 저장 위치를 바로 계산하는 자료 구조다. 평균적으로 O(1)에 삽입·조회·삭제가 가능해 조회가 잦은 데이터에 적합하다. 서로 다른 키가 같은 위치를 가리키는 충돌이 발생할 수 있어 이를 처리하는 방법이 성능을 좌우한다. 저장된 비율이 높아지면 충돌이 급증하므로 임계치를 넘으면 공간을 늘리고 전체를 다시 배치한다.",
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
    detail:
      "서로 다른 키가 같은 해시 값을 갖거나 같은 버킷에 배정되는 상황이다. 해결 방법은 크게 두 가지로, 체이닝은 같은 버킷에 연결 리스트나 트리를 달아 여러 값을 보관하고, 개방 주소법은 비어 있는 다른 버킷을 찾아 저장한다. 개방 주소법에는 바로 다음 칸을 보는 선형 탐사, 다른 해시 함수를 쓰는 이중 해싱 등이 있다. 충돌이 심해지면 조회가 최악 O(n)까지 나빠지므로 적재율 관리가 중요하다.",
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
    detail:
      "정렬된 데이터에서 가운데 값과 비교해 탐색 범위를 절반씩 줄여가는 알고리즘이다. 한 번 비교할 때마다 후보가 반으로 줄어 O(log n)에 원하는 값을 찾는다. 데이터가 정렬돼 있어야 하고 임의 접근이 가능해야 하므로 배열에는 적합하지만 연결 리스트에는 쓸 수 없다. 값이 없을 때 삽입 위치를 찾는 용도로도 자주 활용된다.",
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
    detail:
      "왼쪽 자식은 부모보다 작고 오른쪽 자식은 큰 규칙을 지키는 트리다. 이 규칙 덕분에 비교하며 한쪽으로 내려가면 평균 O(log n)에 값을 찾을 수 있다. 그러나 정렬된 순서로 삽입하면 한쪽으로만 자라 연결 리스트처럼 되어 O(n)으로 나빠진다. 이를 막기 위해 삽입·삭제 시 회전으로 균형을 맞추는 AVL 트리나 레드-블랙 트리를 사용한다.",
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
    detail:
      "부모가 자식보다 항상 크거나 항상 작은 규칙을 지키는 완전 이진 트리다. 루트에 최댓값이나 최솟값이 있어 O(1)에 확인할 수 있고, 삽입과 삭제는 O(log n)에 처리된다. 완전 이진 트리라 배열로 간단히 표현할 수 있어 메모리 효율도 좋다. 우선순위 큐의 구현체로 쓰이며 다익스트라 알고리즘, 작업 스케줄링, 상위 K개 추출에 활용된다.",
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
    detail:
      "정점과 이를 잇는 간선으로 관계를 표현하는 자료 구조다. 간선에 방향이 있으면 방향 그래프, 가중치가 있으면 가중 그래프라고 한다. 인접 행렬은 두 정점의 연결 여부를 O(1)에 확인할 수 있지만 정점 수의 제곱만큼 공간을 쓰고, 인접 리스트는 공간을 아끼는 대신 확인에 시간이 더 걸린다. 도로망, 소셜 네트워크, 작업 의존 관계처럼 연결 구조를 다루는 문제에 쓰인다.",
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
    detail:
      "한 갈래를 끝까지 파고든 뒤 막히면 되돌아와 다른 갈래를 탐색하는 방식이다. 스택이나 재귀로 구현하며 방문 표시를 남겨 같은 정점을 다시 방문하지 않게 한다. 모든 경로를 찾거나 사이클을 검출하고 위상 정렬을 수행하는 데 적합하다. 시간 복잡도는 정점과 간선 수에 비례하는 O(V+E)이며, 그래프가 깊으면 재귀 호출이 쌓여 스택이 넘칠 수 있다.",
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
    detail:
      "시작 정점에서 가까운 순서대로 층을 이루며 탐색하는 방식이다. 큐에 다음 방문할 정점을 넣고 앞에서부터 꺼내며 진행한다. 모든 간선의 가중치가 같은 그래프에서 최단 경로를 찾는 데 적합하며, 처음 도달한 경로가 곧 최단 경로가 된다. 시간 복잡도는 O(V+E)이고 층이 넓으면 큐에 많은 정점이 쌓여 메모리를 더 쓴다.",
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
    detail:
      "큰 문제를 작은 문제로 나누되, 겹치는 하위 문제의 결과를 저장해 다시 계산하지 않는 기법이다. 적용하려면 최적 부분 구조와 중복 부분 문제라는 두 조건이 성립해야 한다. 재귀 호출에 결과 저장을 더한 메모이제이션 방식과, 작은 문제부터 표를 채워 올라가는 타뷸레이션 방식이 있다. 지수 시간이 걸리던 문제를 다항 시간으로 줄일 수 있지만 저장 공간이 추가로 필요하다.",
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
    detail:
      "매 단계에서 당장 가장 좋아 보이는 선택을 하는 방식이다. 구현이 단순하고 빠르지만, 지역 최적의 연속이 전체 최적이 되려면 탐욕적 선택 속성과 최적 부분 구조가 성립해야 한다. 거스름돈 문제처럼 동전 단위에 따라 최적이 되기도 하고 아니기도 해서 반례 확인이 중요하다. 조건이 성립한다면 동적 계획법보다 훨씬 효율적이므로, 먼저 증명이나 반례 검토를 해보는 것이 좋다.",
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
    detail:
      "함수가 자기 자신을 호출해 문제를 더 작은 같은 형태의 문제로 나누는 방식이다. 트리 순회나 분할 정복처럼 구조가 반복되는 문제를 간결하게 표현할 수 있다. 반드시 종료 조건이 있어야 하며, 없거나 잘못되면 호출이 무한히 쌓여 스택이 넘친다. 호출마다 스택 프레임이 쌓이므로 깊이가 크면 반복문으로 바꾸거나 명시적 스택을 쓰는 편이 안전하다.",
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
    detail:
      "브라우저가 HTML 문서를 파싱해 만든 객체 트리이자, 스크립트가 문서를 읽고 조작할 수 있게 하는 인터페이스다. 각 태그가 노드가 되어 부모·자식 관계를 이루고, 자바스크립트는 이 노드를 찾아 속성이나 내용을 바꿀 수 있다. DOM을 직접 많이 조작하면 그때마다 레이아웃 계산과 화면 그리기가 발생해 느려질 수 있다. 그래서 프레임워크들은 변경을 모아 최소한만 반영하는 전략을 쓴다.",
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
    detail:
      "실제 DOM을 흉내 낸 가벼운 자바스크립트 객체 트리다. 상태가 바뀌면 새 트리를 만들어 이전 트리와 비교하고, 달라진 부분만 실제 DOM에 반영한다. 개발자는 화면을 어떻게 바꿀지가 아니라 어떤 상태일 때 어떤 화면인지만 선언하면 된다. 비교 자체에도 비용이 들기 때문에 항상 직접 조작보다 빠른 것은 아니지만, 코드가 단순해지고 실수로 인한 과도한 조작을 막아준다.",
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
    detail:
      "서버는 빈 HTML과 자바스크립트만 보내고 브라우저가 화면을 그리는 방식이다. 첫 화면이 나오기까지 스크립트를 내려받아 실행해야 해 초기 로딩이 느리고, 크롤러가 내용을 못 볼 수 있어 검색 노출에 불리하다. 대신 한 번 로드된 뒤에는 페이지 전환이 부드럽고 서버 부하가 적다. 로그인 후 대시보드처럼 검색 노출이 필요 없고 상호작용이 많은 화면에 적합하다.",
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
    detail:
      "요청이 올 때마다 서버에서 HTML을 만들어 보내는 방식이다. 브라우저가 받자마자 내용을 보여줄 수 있어 첫 화면 표시가 빠르고 검색 크롤러도 내용을 읽을 수 있다. 대신 요청마다 서버가 렌더링하므로 부하가 늘고 응답 시간이 서버 상태에 좌우된다. 사용자마다 다른 데이터를 보여주면서 검색 노출도 필요한 화면에 적합하다.",
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
    detail:
      "빌드 시점에 미리 HTML을 만들어 두고 요청이 오면 그대로 내려주는 방식이다. 서버가 렌더링할 일이 없어 가장 빠르고 CDN에 그대로 올릴 수 있다. 데이터가 바뀌면 다시 빌드해야 하므로 자주 변하는 콘텐츠에는 맞지 않는다. 문서, 블로그, 용어 사전처럼 내용이 고정적이고 모든 사용자에게 같은 화면을 보여주는 페이지에 적합하다.",
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
    detail:
      "서버가 보낸 정적 HTML에 자바스크립트를 연결해 상호작용이 가능한 상태로 만드는 과정이다. 브라우저는 이미 그려진 마크업을 그대로 두고 이벤트 핸들러와 상태만 붙인다. 이 과정이 끝나기 전에는 화면은 보이지만 버튼이 반응하지 않을 수 있다. 서버와 클라이언트가 만든 결과가 다르면 불일치 오류가 발생하므로, 렌더링 중 현재 시각이나 난수처럼 매번 달라지는 값을 쓰지 않아야 한다.",
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
    detail:
      "요소의 크기나 위치가 바뀌어 브라우저가 레이아웃을 다시 계산하는 과정이다. 한 요소가 바뀌면 주변이나 자식 요소까지 영향을 받아 비용이 크다. 색상처럼 배치에 영향을 주지 않는 변경은 다시 그리기만 하는 리페인트로 끝난다. transform과 opacity는 합성 단계에서 처리돼 두 과정을 건너뛸 수 있어 애니메이션에 유리하다.",
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
    detail:
      "화면에서 가장 큰 콘텐츠 요소가 표시되기까지 걸린 시간으로, 사용자가 체감하는 로딩 속도를 나타낸다. 보통 큰 이미지나 제목 텍스트가 대상이 되며 2.5초 이내를 권장한다. 서버 응답을 빠르게 하고, 대상 이미지를 우선 로딩하며, 렌더링을 막는 리소스를 줄이면 개선된다. 레이아웃 이동을 나타내는 CLS, 입력 반응성을 나타내는 INP와 함께 핵심 웹 지표로 묶인다.",
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
    detail:
      "여러 모듈과 자원을 의존 관계에 따라 묶어 배포용 파일로 만드는 도구다. 모듈 시스템을 해석해 브라우저가 이해할 수 있는 형태로 변환하고, 사용하지 않는 코드를 제거하거나 파일을 압축한다. 요청 수를 줄여 로딩을 빠르게 하지만 하나로 다 묶으면 초기 파일이 커지는 문제가 생긴다. 그래서 라우트나 기능 단위로 나누는 코드 스플리팅과 함께 쓴다.",
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
    detail:
      "번들에 포함됐지만 실제로 사용되지 않는 코드를 제거하는 최적화다. import와 export를 정적으로 분석할 수 있어야 하므로 ES 모듈 문법이 전제다. 라이브러리 전체를 가져오는 대신 필요한 함수만 가져오면 효과가 커진다. 모듈이 불러오는 것만으로 부수 효과를 일으키면 제거되지 않을 수 있어, 라이브러리가 부수 효과 없음을 명시하는 설정이 도움이 된다.",
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
    detail:
      "하나의 큰 번들을 여러 조각으로 나눠 필요한 시점에 내려받게 하는 기법이다. 라우트 단위로 나누면 첫 화면에 필요 없는 코드를 나중에 불러올 수 있어 초기 로딩이 빨라진다. 모달이나 에디터처럼 특정 상호작용에서만 쓰는 무거운 코드도 분리 대상이다. 너무 잘게 나누면 요청 수가 늘어 오히려 느려질 수 있으므로, 사용자가 곧 필요할 조각은 미리 가져오는 프리페치와 함께 조절한다.",
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
    detail:
      "함수가 선언될 당시의 렉시컬 환경을 기억해, 바깥 함수의 실행이 끝난 뒤에도 그 변수에 접근할 수 있는 성질이다. 이를 이용해 외부에서 직접 건드릴 수 없는 상태를 만들고 특정 함수로만 조작하게 할 수 있다. 함수를 만들어내는 팩토리나 인자를 미리 채워둔 함수도 클로저로 구현된다. 참조가 남아 있는 동안 관련 변수도 메모리에 유지되므로, 큰 데이터를 오래 붙잡지 않도록 주의해야 한다.",
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
    detail:
      "자바스크립트가 단일 스레드로 비동기 작업을 처리하는 실행 구조다. 콜 스택이 비면 큐에서 대기 중인 콜백을 꺼내 실행하는데, 프로미스 콜백이 담기는 마이크로태스크 큐를 setTimeout 같은 매크로태스크보다 먼저 모두 비운다. 타이머나 네트워크 요청 같은 작업 자체는 런타임이 대신 수행하고 완료된 콜백만 큐에 넣는다. 동기 코드가 오래 실행되면 큐 처리가 밀려 화면이 멈춘 것처럼 보이므로 긴 작업은 쪼개야 한다.",
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
    detail:
      "비동기 작업의 최종 결과를 나타내는 객체다. 대기 상태에서 시작해 이행이나 거부로 한 번만 전이하며, 이후 상태는 바뀌지 않는다. then과 catch로 결과를 이어 처리할 수 있고, async/await 문법을 쓰면 동기 코드처럼 읽히게 작성할 수 있다. 서로 독립적인 작업은 Promise.all로 함께 실행해야 하며, await를 나열하면 불필요하게 순차 대기하게 된다.",
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
    detail:
      "데이터를 직접 수정하지 않고 변경된 새 값을 만들어 사용하는 원칙이다. 이전 값이 그대로 남아 있어 변경 시점을 추적하기 쉽고, 참조만 비교해도 값이 바뀌었는지 판단할 수 있다. React처럼 참조 비교로 다시 그릴지 결정하는 환경에서는 배열이나 객체를 직접 수정하면 화면이 갱신되지 않는 문제가 생긴다. 전개 연산자는 최상위만 복사하므로 중첩 구조를 다룰 때는 어느 깊이까지 새로 만드는지 명확히 해야 한다.",
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
    detail:
      "같은 입력에 항상 같은 결과를 반환하고 외부 상태를 바꾸지 않는 함수다. 실행 순서나 외부 환경에 영향을 받지 않아 결과를 예측하기 쉽고 테스트할 때 준비할 것이 적다. 화면 렌더링이나 데이터 가공 로직을 순수 함수로 분리해 두면 UI 없이도 검증할 수 있다. 네트워크 요청이나 로깅처럼 부수 효과가 필요한 부분은 경계로 밀어내고 핵심 계산만 순수하게 유지하는 것이 일반적인 설계다.",
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
    detail:
      "화면이 참조하는 데이터를 어디에 두고 어떻게 갱신할지 다루는 방법이다. 서버에서 받아오는 데이터와 사용자 입력 같은 클라이언트 상태는 성격이 달라 구분해 다루는 것이 좋다. 서버 상태는 캐시와 갱신 시점, 중복 요청 처리가 핵심이라 전용 라이브러리를 쓰고, 클라이언트 상태는 필요한 범위에서 가장 가까운 곳에 두는 것이 원칙이다. 무엇이든 전역에 두면 어디서 바뀌는지 추적하기 어려워진다.",
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
    detail:
      "장애 여부나 사용 환경과 관계없이 누구나 콘텐츠를 이용할 수 있게 만드는 설계 원칙이다. 의미에 맞는 시맨틱 태그를 써서 스크린 리더가 구조를 파악하게 하고, 버튼과 링크에는 명확한 이름을 제공한다. 마우스 없이 키보드만으로 모든 기능을 쓸 수 있어야 하며 현재 포커스가 어디인지 보여야 한다. 색상만으로 상태를 전달하지 않고 텍스트나 아이콘을 함께 쓰며, 명도 대비와 모션 감소 설정도 고려한다.",
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
    detail:
      "하나의 페이지가 화면 크기에 따라 레이아웃을 바꾸도록 만드는 방식이다. 고정 픽셀 대신 상대 단위와 유연한 그리드를 쓰고, 미디어 쿼리로 중단점을 나눠 배치를 조정한다. 중단점은 특정 기기 크기가 아니라 콘텐츠가 어색해지는 지점을 기준으로 정하는 것이 좋다. 이미지에는 크기와 여러 해상도 후보를 지정해 레이아웃 이동과 과도한 전송을 막는다.",
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
    detail:
      "공격자가 웹 페이지에 악성 스크립트를 삽입해 다른 사용자의 브라우저에서 실행시키는 취약점이다. 실행된 스크립트는 그 사용자의 권한으로 동작하므로 쿠키 탈취, 위장 요청, 화면 변조가 가능하다. 사용자 입력을 화면에 출력할 때 이스케이프하고, 신뢰할 수 없는 HTML을 그대로 삽입하지 않으며, CSP로 실행 가능한 스크립트를 제한해 막는다. XSS가 뚫리면 다른 방어 수단도 함께 무력해지므로 우선순위가 높다.",
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
    detail:
      "로그인한 사용자의 브라우저가 공격자가 의도한 요청을 자신도 모르게 보내게 만드는 공격이다. 브라우저가 쿠키를 자동으로 실어 보내는 성질을 이용하므로, 사용자는 링크를 클릭하거나 페이지를 열기만 해도 피해를 입을 수 있다. 예측 불가능한 CSRF 토큰을 요청에 포함시키거나, 쿠키에 SameSite 속성을 설정해 교차 사이트 요청에 실리지 않게 막는다. 상태를 바꾸는 요청을 GET으로 처리하지 않는 것도 기본 원칙이다.",
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
    detail:
      "서버가 브라우저에 저장해 두고 이후 요청마다 자동으로 함께 전송되는 작은 데이터다. 만료 시각, 전송 범위, 스크립트 접근 차단을 뜻하는 HttpOnly, HTTPS 전송만 허용하는 Secure 같은 속성을 지정할 수 있다. 자동 전송되기 때문에 인증 정보를 담기 편하지만 같은 이유로 CSRF에 노출되므로 SameSite 설정이 중요하다. 용량이 작고 매 요청에 실리므로 큰 데이터는 localStorage 같은 저장소를 쓰되, 스크립트로 읽을 수 있어 민감한 값에는 부적합하다.",
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
    detail:
      "서로 다른 프로그램이 기능이나 데이터를 주고받기 위해 약속한 인터페이스다. 내부 구현을 감추고 정해진 요청과 응답 형식만 공개하므로, 내부를 바꿔도 약속을 지키면 사용하는 쪽은 영향을 받지 않는다. 웹에서는 주로 HTTP로 자원을 요청하고 JSON으로 응답을 주고받는다. 한번 공개하면 사용하는 쪽이 생기므로 응답 필드를 없애거나 의미를 바꾸는 변경은 신중해야 한다.",
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
    detail:
      "요청이 최종 처리기에 닿기 전이나 응답이 나가기 전에 공통 작업을 수행하는 계층이다. 인증 확인, 로깅, 요청 검증, 리다이렉션처럼 여러 경로에 공통으로 필요한 처리를 한곳에 모을 수 있다. 여러 개를 순서대로 연결해 파이프라인처럼 구성하며, 앞선 단계가 요청을 중단시킬 수도 있다. 모든 요청을 거치므로 무거운 작업을 넣으면 전체 응답 시간에 영향을 준다.",
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
    detail:
      "요청을 보낸 주체가 누구인지 확인하는 과정이다. 아이디와 비밀번호, 소셜 로그인, 일회용 코드 같은 수단으로 신원을 증명받고, 이후 요청에서는 세션이나 토큰으로 확인한다. 비밀번호는 반드시 복원 불가능한 해시로 저장하고, 무차별 대입을 막기 위한 시도 제한도 함께 둔다. 누구인지 확인했다고 해서 무엇을 할 수 있는지가 정해지는 것은 아니며 그것은 인가의 영역이다.",
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
    detail:
      "인증된 주체가 특정 자원이나 기능에 접근할 권한이 있는지 판단하는 과정이다. 역할 기반으로 권한을 묶거나 자원의 소유자인지 확인하는 방식이 흔하다. 화면에서 버튼을 감추는 것은 편의일 뿐 보안이 아니며, 요청이 들어올 때 서버에서 반드시 다시 확인해야 한다. 데이터베이스 차원에서 행 단위 정책을 걸어두면 애플리케이션이 조건을 빠뜨려도 한 겹 더 막을 수 있다.",
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
    detail:
      "사용자 정보를 담고 서명한 토큰을 주고받아 인증 상태를 유지하는 방식이다. 서버가 상태를 저장하지 않아도 서명만 검증하면 위조 여부를 알 수 있어 서버를 늘리기 쉽다. 다만 발급된 토큰은 만료 전까지 유효해 강제로 로그아웃시키기 어렵고, 내용은 서명됐을 뿐 암호화되지 않아 민감한 정보를 담으면 안 된다. 그래서 만료를 짧게 두고 갱신용 토큰을 함께 쓰는 구성이 일반적이다.",
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
    detail:
      "서버가 로그인 상태를 저장소에 보관하고 클라이언트에는 식별자만 내려주는 인증 방식이다. 서버가 상태를 쥐고 있어 언제든 특정 세션을 무효화할 수 있고 저장 정보에 제한이 없다. 대신 서버를 여러 대로 늘리면 세션을 공유할 저장소가 필요하고, 저장소가 죽으면 전체 로그인이 풀린다. 식별자는 보통 HttpOnly 쿠키로 전달해 스크립트가 읽지 못하게 한다.",
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
    detail:
      "같은 요청을 여러 번 보내도 결과 상태가 한 번 보낸 것과 같은 성질이다. 네트워크 오류나 타임아웃으로 클라이언트가 재시도하는 일이 흔하기 때문에, 결제나 주문 생성처럼 중복되면 안 되는 작업에서 특히 중요하다. 클라이언트가 보낸 멱등성 키를 저장해 같은 키의 요청에는 이전 결과를 그대로 돌려주거나, 고유 제약으로 중복 삽입을 막는 방식으로 구현한다. 조회와 삭제는 본래 멱등하도록 설계하는 것이 원칙이다.",
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
    detail:
      "일정 시간 동안 허용할 요청 수를 제한해 자원 남용과 과부하를 막는 기법이다. 고정 윈도우는 구현이 단순하지만 경계 시점에 순간적으로 두 배의 요청이 몰릴 수 있고, 슬라이딩 윈도우나 토큰 버킷은 이를 완화하며 짧은 폭주를 어느 정도 허용할지도 조절할 수 있다. 서버가 여러 대면 카운터를 공유 저장소에 두어야 정확히 동작한다. 제한에 걸리면 429 상태 코드와 함께 언제 다시 시도하면 되는지 알려주는 것이 좋다.",
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
    detail:
      "자주 쓰는 데이터를 더 빠른 저장소에 복사해 두고 재사용하는 기법이다. 원본 조회 비용을 줄여 응답을 빠르게 하고 부하를 낮추지만, 원본이 바뀌었을 때 캐시를 언제 버릴지 정하지 않으면 오래된 값이 계속 나간다. 만료 시간을 두는 방법과 변경 시점에 직접 무효화하는 방법을 조합해 쓴다. 인기 있는 키가 동시에 만료되면 요청이 원본으로 몰리는 현상이 생길 수 있어 만료 시각을 흩뿌리기도 한다.",
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
    detail:
      "생산자가 보낸 메시지를 큐에 쌓아 두고 소비자가 꺼내 처리하게 하는 구조다. 두 쪽이 직접 연결되지 않아 소비자가 잠시 느려지거나 죽어도 생산자는 영향을 덜 받고, 트래픽이 몰릴 때 큐가 완충 역할을 한다. 이메일 발송이나 이미지 처리처럼 즉시 응답이 필요 없는 작업을 비동기로 넘기는 데 적합하다. 대신 처리 순서 보장, 같은 메시지가 두 번 전달될 가능성, 계속 실패하는 메시지를 따로 모으는 처리를 설계해야 한다.",
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
    detail:
      "이벤트가 발생했을 때 서버가 미리 등록된 URL로 요청을 보내 알려주는 방식이다. 받는 쪽이 주기적으로 물어보는 폴링과 달리 변화가 있을 때만 통신이 일어나 효율적이다. 결제 승인, 저장소 푸시, 배포 완료 알림처럼 외부 서비스와 연동할 때 널리 쓰인다. 요청이 정말 그 서비스에서 왔는지 서명으로 검증해야 하고, 실패 시 재전송되는 경우가 많아 받는 쪽이 멱등하게 처리해야 한다.",
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
    detail:
      "정해진 주기에 대량의 데이터를 모아 한꺼번에 처리하는 작업이다. 통계 집계, 정리 작업, 정기 알림처럼 실시간일 필요가 없는 처리를 사용자 요청과 분리할 수 있다. 서버가 여러 대면 같은 작업이 동시에 돌지 않도록 단일 실행을 보장해야 하고, 전체를 한 번에 처리하면 부하가 크므로 범위를 나눠 진행 지점을 기록한다. 중간에 실패해도 다시 실행할 수 있도록 멱등하게 작성하는 것이 중요하다.",
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
    detail:
      "실행 중 발생한 사건을 기록해 문제의 원인을 추적할 수 있게 하는 활동이다. 요청 식별자를 함께 남기면 흩어진 로그를 하나의 요청 흐름으로 묶어 볼 수 있고, 구조화된 형식으로 남기면 검색과 집계가 쉬워진다. 비밀번호, 토큰, 개인정보는 절대 남기지 않으며 오류 응답에도 내부 스택이나 데이터베이스 메시지를 그대로 노출하지 않는다. 정상 흐름까지 과도하게 남기면 비용과 소음이 커지므로 실패와 경계 지점을 중심으로 기록한다.",
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
    detail:
      "호환성을 깨는 변경이 필요할 때 새 버전을 만들어 기존 클라이언트를 보호하는 방식이다. 필드 추가처럼 기존 동작에 영향이 없는 변경은 버전을 올리지 않고, 필드 삭제나 의미 변경처럼 깨뜨리는 변경만 분리한다. 경로에 버전을 넣는 방식이 가장 눈에 잘 띄고 캐시나 라우팅과도 잘 맞는다. 구버전은 사용량을 관측하며 폐기 일정을 미리 공지하고 전환 기간 동안 두 버전을 함께 운영한다.",
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
    detail:
      "코드 바깥에서 주입하는 설정값으로, 환경마다 달라지는 값과 비밀을 코드에서 분리하는 수단이다. 데이터베이스 주소나 API 키처럼 저장소에 올리면 안 되는 값을 여기에 둔다. 어떤 변수가 필요한지는 예시 파일로 남겨 두고 실제 값은 배포 환경의 설정에 넣는다. 클라이언트 번들에 포함되는 변수는 누구나 볼 수 있으므로 비밀을 담아서는 안 된다.",
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
    detail:
      "사용자 입력이 SQL 문의 구조를 바꾸도록 조작해 의도하지 않은 쿼리를 실행시키는 공격이다. 성공하면 인증 우회, 데이터 탈취, 삭제까지 가능해 영향이 크다. 입력값을 문자열로 이어 붙여 쿼리를 만들지 말고, 값과 구조를 분리하는 파라미터화된 쿼리를 사용하면 근본적으로 막을 수 있다. 오류 메시지 숨김이나 입력 필터링은 보조 수단일 뿐 대체재가 아니며, 계정 권한을 최소로 두는 것도 피해를 줄인다.",
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
    detail:
      "서버 대수를 늘려 전체 처리량을 키우는 확장 방식이다. 이론적으로 상한이 없고 한 대가 죽어도 나머지가 처리를 이어가 가용성이 높아진다. 대신 요청이 어느 서버로 가도 같은 결과가 나오도록 상태를 서버 메모리에 두지 않는 설계와 로드 밸런서가 필요하다. 반대로 서버 한 대의 사양을 올리는 수직 확장은 구조 변경이 거의 없어 간단하지만 물리적 한계가 있고 그 서버가 단일 장애점이 된다.",
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
    detail:
      "서버가 요청 사이의 상태를 보관하지 않는 설계 원칙이다. 각 요청이 필요한 정보를 스스로 담고 있어 어느 서버가 처리해도 결과가 같다. 덕분에 서버를 자유롭게 늘리거나 교체할 수 있고 배포와 장애 복구가 단순해진다. 로그인 상태 같은 정보는 서버 메모리 대신 토큰이나 외부 저장소에 두어 이 원칙을 유지한다.",
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
    detail:
      "하나의 애플리케이션을 독립적으로 배포할 수 있는 작은 서비스들로 나누는 아키텍처다. 서비스별로 필요한 만큼만 확장하고 팀별로 독립 배포할 수 있어 규모가 큰 조직에서 개발 속도를 유지하기 좋다. 대신 함수 호출이던 것이 네트워크 호출이 되어 장애와 지연이 늘고, 여러 서비스에 걸친 트랜잭션 처리와 추적이 어려워진다. 도메인 경계가 명확해지기 전에 나누면 오히려 복잡도만 커지므로 모놀리식으로 시작해 필요할 때 분리하는 편이 안전하다.",
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
    detail:
      "네트워크로 연결된 분산 시스템은 일관성, 가용성, 분할 내성 셋을 동시에 완전히 만족할 수 없다는 정리다. 네트워크 분할은 현실에서 피할 수 없으므로 실제 선택은 분할이 발생했을 때 일관성을 지킬지 가용성을 지킬지가 된다. 잔액이나 재고처럼 정확성이 중요한 데이터는 일관성을, 피드 조회나 조회수처럼 잠시 오래된 값이 허용되는 데이터는 가용성을 택한다. 시스템 전체가 아니라 데이터 성격별로 다르게 선택하는 것이 일반적이다.",
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
    detail:
      "쓰기 직후에는 노드마다 값이 다를 수 있지만 시간이 지나면 모두 같은 값으로 수렴하는 일관성 모델이다. 모든 노드가 동기화될 때까지 기다리지 않아도 되므로 응답이 빠르고 가용성과 확장성이 좋다. 대신 방금 쓴 데이터를 다른 노드에서 읽으면 이전 값이 보일 수 있어, 사용자에게 혼란을 주지 않도록 화면 설계에서 보완해야 한다. 반대로 쓰기가 끝나면 이후 모든 읽기가 최신 값을 보장하는 것이 강한 일관성이다.",
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
    detail:
      "외부 호출이 반복해서 실패하면 일정 시간 동안 아예 호출하지 않고 즉시 실패로 처리하는 패턴이다. 응답 없는 서비스를 계속 호출하면 스레드와 연결이 묶여 장애가 호출한 쪽으로 번지는데, 이를 끊어 연쇄 실패를 막는다. 일정 시간이 지나면 일부 요청만 흘려보내 회복 여부를 확인하고 정상이면 다시 연다. 차단된 동안 무엇을 대신 보여줄지 대체 응답을 함께 설계해야 한다.",
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
    detail:
      "동일한 두 개의 운영 환경을 두고 트래픽을 전환하는 방식으로 배포하는 전략이다. 현재 버전이 도는 환경은 그대로 두고 새 버전을 다른 환경에 올려 검증한 뒤 트래픽을 넘긴다. 문제가 생기면 트래픽을 되돌리기만 하면 되어 롤백이 매우 빠르다. 대신 두 환경을 동시에 유지해야 해 자원이 두 배로 들고, 데이터베이스처럼 공유되는 자원은 두 버전이 함께 동작할 수 있도록 하위 호환을 지켜야 한다.",
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
    detail:
      "변경을 자주 통합해 자동으로 검증하고, 검증된 결과를 자동으로 배포하는 방식이다. 통합이 잦으면 충돌 범위가 작아지고 문제를 일찍 발견할 수 있다. 빌드, 린트, 타입 검사, 테스트를 파이프라인으로 묶어 사람이 잊지 않도록 만드는 것이 핵심이다. 배포까지 자동화하면 배포가 특별한 행사가 아니라 일상이 되어, 작은 단위로 자주 내보낼 수 있다.",
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
    detail:
      "서버, 네트워크, 권한 같은 인프라 구성을 코드로 정의해 관리하는 방식이다. 코드이므로 버전 관리와 리뷰가 가능하고, 같은 정의로 개발·스테이징·운영 환경을 동일하게 만들 수 있다. 콘솔에서 수동으로 바꾼 설정은 기록에 남지 않아 나중에 재현할 수 없는데 이 문제를 없앤다. 실제 인프라와 코드가 어긋나지 않도록 변경은 항상 코드를 통해서만 적용하는 규율이 필요하다.",
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
    detail:
      "애플리케이션과 실행에 필요한 라이브러리를 하나로 묶어 격리된 환경에서 실행하는 단위다. 호스트 운영체제의 커널을 공유하기 때문에 가상 머신보다 훨씬 가볍고 시작이 빠르다. 이미지로 만들어 두면 개발자 노트북과 운영 서버에서 같은 환경이 재현돼 환경 차이로 인한 문제가 줄어든다. 커널을 공유하는 만큼 가상 머신 수준의 격리는 아니라는 점을 고려해야 한다.",
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
    detail:
      "여러 컨테이너의 배치, 확장, 복구, 네트워크 연결을 자동으로 관리하는 것이다. 원하는 상태를 선언하면 실제 상태를 그에 맞추는 방식으로 동작해, 컨테이너가 죽으면 자동으로 다시 띄우고 부하에 따라 개수를 조절한다. 쿠버네티스가 사실상 표준이며 배포 전략, 서비스 디스커버리, 설정과 비밀 관리 기능을 함께 제공한다. 강력한 만큼 학습과 운영 비용이 크므로 규모에 맞는지 판단이 필요하다.",
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
    detail:
      "서버를 직접 준비하지 않고 요청이 있을 때만 함수가 실행되는 실행 모델이다. 사용한 실행 시간과 호출 수만큼 과금되므로 트래픽이 적거나 들쭉날쭉한 워크로드에 유리하다. 운영체제 패치나 용량 확보를 제공자가 담당해 운영 부담이 적다. 대신 한동안 호출이 없다가 처음 실행될 때 지연이 생기는 콜드 스타트가 있고, 실행 시간과 상태 유지에 제약이 있다.",
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
    detail:
      "부하 지표에 따라 인스턴스 수를 자동으로 늘리거나 줄이는 기능이다. CPU 사용률이나 요청 수 같은 지표에 임계값을 걸어 두면 트래픽이 몰릴 때 늘리고 한산해지면 줄여 비용을 아낀다. 인스턴스가 준비되는 데 시간이 걸리므로 갑작스러운 폭증에는 완전히 대응하지 못할 수 있어, 예상되는 이벤트에는 미리 늘려 두기도 한다. 축소될 때 처리 중인 요청이 끊기지 않도록 종료 절차를 설계해야 한다.",
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
    detail:
      "로그, 지표, 추적을 통해 시스템 내부에서 무슨 일이 일어나는지 밖에서 파악할 수 있는 정도를 뜻한다. 미리 정해둔 항목만 보는 모니터링보다 넓은 개념으로, 예상하지 못한 문제의 원인까지 좁혀갈 수 있는 것을 목표로 한다. 요청량, 오류율, 지연 시간, 자원 사용률을 지표로 수집하고 분산 환경에서는 추적으로 요청 경로를 잇는다. 알림은 사용자 영향에 직결되는 지표에만 걸어야 피로가 쌓이지 않는다.",
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
    detail:
      "SLA는 서비스 제공자가 사용자와 약속한 서비스 수준이고, SLO는 그 약속을 지키기 위해 내부적으로 정한 목표다. 가용성 99.9퍼센트나 응답 시간 같은 측정 가능한 지표로 정의하며, 목표 대비 여유분을 뜻하는 오류 예산 개념과 함께 쓰인다. 예산이 남아 있으면 새 기능을 과감히 배포하고, 소진되면 안정화에 집중하는 식으로 의사결정 기준이 된다. 지표를 측정할 수 없으면 약속도 의미가 없으므로 관측 체계가 전제다.",
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
    detail:
      "버전을 MAJOR.MINOR.PATCH 세 자리로 매기고 각 자리의 의미를 정한 규칙이다. 호환성을 깨는 변경에는 MAJOR, 호환성을 유지하는 기능 추가에는 MINOR, 호환되는 버그 수정에는 PATCH를 올린다. 사용하는 쪽은 버전 번호만 보고 업그레이드가 안전한지 판단할 수 있다. 규모가 크다고 MAJOR를 올리면 이 약속이 무너지므로, 크기가 아니라 호환성 파괴 여부로 판단해야 한다.",
    aliases: ["Semantic Versioning", "SemVer"],
    category: "system_design",
    related: ["api-versioning", "ci-cd"],
    created_at: CREATED_AT,
  },
];
