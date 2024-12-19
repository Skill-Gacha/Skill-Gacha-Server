
<p align="center">
  <img src="https://github.com/user-attachments/assets/9b0ddbdd-efec-4978-b9cb-bb225574a685" alt="gametitle_origin" width="500" height="350">
</p>

# <div align="center">가차없는 스킬 가챠</div>


## 소개
“가차 없는 스킬 가챠”는 다양한 스킬을 전략적으로 조합하는 턴제 MORPG 게임입니다.  
기존 RPG 시스템이 ‘상위 스킬 활용’에 초점을 맞추었다면, 전투는 불, 물, 풀, 전기, 땅의 5가지 속성 상호작용을 바탕으로 진행되며,   
단순히 강한 스킬을 쓰는 것이 아니라 속성 이해도, 스킬 강화, 아이템 사용 전략을 통해 전투를 유리하게 이끌어갈 수 있습니다.  

본 프로젝트의 특징으로 다음의 3가지를 들 수 있습니다.
 - 랜덤으로 획득한 다양한 스킬을 조합, 강화하여 개성 있는 전투 빌드를 구축
 - 속성 상성 기반의 전략적 전투 전개
 - 아이템 사용 및 PVP(1:1 전투), 파티 기반 BOSS RAID 등을 통한 몰입감 높은 게임 플레이


## 서비스 아키텍쳐

![아키텍쳐2 JPG](https://github.com/user-attachments/assets/93d53174-565b-4159-994a-8cf2eabcf389)

- 이벤트 루프를 통한 비동기 I/O 처리
- Protobuf를 활용한 역/직렬화
- Redis를 이용한 DB 캐싱
- MySQL 기반 관계형 데이터 관리
- Bull을 통한 매칭 처리 원자성 확보

## 핵심 기술 - 상태 머신 기반 플로우 관리
게임 서버 로직은 단순히 요청-응답 형태로 처리되는 것이 아니라, **플레이어의 진행 상황**, **던전 상태**, **전투 단계**에 따라 다양한 흐름을 가진다는 점에서 복잡성이 높습니다.  
이를 체계적으로 관리하기 위해 **상태 머신(State Machine) 패턴**을 도입하였습니다.

### 왜 상태 머신인가?

전통적인 RPC 스타일의 처리나 단순 `if-else` 분기는 규모가 커지면 각 단계별 전환, 예외 처리 등을 관리하기 어려워집니다.  
이에 비해 상태 머신 패턴을 도입하면, **각 상태**(State)가 독립적으로 존재하고, **입력**(Input)에 따라 **명확한 전이**(Transition)가 일어나며, **추상 클래스**를 통한 공통 메서드(`enter()`, `handleInput()`) 구현으로 확장성을 갖출 수 있습니다.

### 설계 포인트

- **추상 상태 클래스(GameState)**:  
  모든 상태 클래스의 기반이 되는 추상 클래스입니다.  
  각 상태는 `enter()`, `handleInput()` 메서드를 반드시 구현해야 하며, 이는 상태 진입 시 초기화 작업과 외부 입력 처리 방식의 일관성을 보장합니다.

- **도메인 별 상태 상속 (`DungeonState`, `ActionState`, `SkillChoiceState` 등)**:  
  던전 컨텍스트를 관리하는 `DungeonState`, 전투 로직을 처리하는 ActionState, 스킬 선택을 담당하는 `SkillChoiceState` 등 **도메인 및 기능별로 세분화된 상태 클래스**를 구성합니다.  
  이를 통해 상태 전이를 명확히 정의하고, 특정 로직 변경 시 해당 상태 클래스만 수정하면 되므로 유지보수성을 높입니다.

- **상태 전환 (`changeState()`)**:  
  상태 전환은 명시적인 메서드(`changeState()`)를 통해 이루어집니다.  
  이로써 상태 전환이 발생하는 지점이 명확하게 드러나며, 전환 시 필요한 초기화(`enter()` 호출) 과정이 일관성 있게 처리됩니다.

### 상태 머신 패턴의 장점

1. **코드 구조 명확화**: 전투 단계, 던전 진행 상황, PVP 로직 등 다양한 시나리오를 상태별로 나누어 관리하므로, 전체 게임 로직 흐름을 쉽게 파악할 수 있습니다.  
2. **유지보수 용이성**: 새로운 상태(예: 신규 던전 패턴, 신 스킬 선택 모드)를 추가하거나, 기존 로직을 변경할 때 다른 상태에 대한 영향이 최소화됩니다.  
3. **추상화 통한 일관성 확보**: 모든 상태는 동일한 추상 클래스를 상속하므로, 상태별 진입(`enter`) 시점, 입력 처리(`handleInput`) 시점이 명확하게 보장됩니다.  이는 팀 개발 및 지속적 기능 확장 상황에서 특히 유용합니다.

### 정리

이와 같이 서버 전체 로직에 상태 머신 패턴을 적용함으로써, **전투/던전 진행이라는 복잡한 흐름**을 명확하고 일관성 있게 관리할 수 있습니다.  
이는 Node.js 비동기 환경과 결합되어 직렬화/역직렬화, 매칭 큐 처리, 캐싱 등 다른 핵심 기술과 유기적으로 동작하며, 결국 유지보수 및 확장성 향상, 개발 효율성 증대로 이어집니다.

## Technologies

### Server

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Protobuf](https://github.com/user-attachments/assets/bd95cf94-a1e8-4ff1-8484-c82414c98c50)
![Bull Queue](https://github.com/user-attachments/assets/1173a561-975e-4a42-bc1e-a2f0e340ea40)

### Client

![Unity](https://img.shields.io/badge/unity-%23000000.svg?style=for-the-badge&logo=unity&logoColor=white)

### DevOps/Infra
![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![Grafana](https://img.shields.io/badge/grafana-%23F46800.svg?style=for-the-badge&logo=grafana&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=Prometheus&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white)



## 핵심 기능

### 스킬 보상 & 강화 시스템  
- 던전에서 랜덤으로 획득한 스킬로 자신만의 스킬 트리를 구성하고 강화하며, 개성 있는 캐릭터와 전략적 플레이를 즐길 수 있습니다.

### 속성 간 상성 기반 전투  
- 불, 물, 풀, 전기, 땅의 5가지 속성은 상성이 존재하기 때문에 단순한 힘 싸움이 아닌 전략과 속성에 대한 이해도를 요구하는 깊이 있는 전투 경험을 제공해줍니다. 

### 다양한 포션  
- 포션은 상황에 따라 전투의 승패를 결정짓는 강력한 변수로 작용합니다.
- HP 등을 회복하거나, 자신의 스탯을 강화하는 등의 기능을 통해 전략적 판단을 유도합니다.

### PVP  
- 플레이어는 1대1 전투에서 속성과 함께 스킬 및 아이템 사용 전략을 세워 승부를 겨루며, 승자는 랭크 점수를 획득하여 높은 순위에 도전할 수 있습니다.

### BOSS RAID  
- 보스 레이드는 3명의 플레이어가 협력하여 강력한 보스를 처치하는 도전적인 콘텐츠입니다. 협동과 스킬 사용 타이밍, 보스 패턴 이해 등이 중요한 요소로 작용합니다.


## 트러블슈팅 (Trouble Shooting)

### [1. 싱글톤이지만 싱글톤이 아니다](https://teamsparta.notion.site/783b818a01364a5480b3310ada8196fe)
- **문제**: Node.js에서 대소문자가 혼용된 import 경로로 인해 동일 모듈이 다른 경로로 캐시되어 싱글톤 인스턴스가 2번 생성되는 현상 발생.  
- **원인**: 윈도우 환경 대소문자 비구분 + Node.js 모듈 캐싱 특성  
- **해결**: import 경로를 대소문자 구분 일관되게 사용하고, 서브패스 임포트 등으로 경로 통일.

### [2. 소켓을 인식할 수 없다](https://teamsparta.notion.site/112013e8112149a28e227ad76a78ab6e)
- **문제**: Bull Queue에 유저 객체 자체를 넣은 뒤 가져올 때, 객체가 단순한 텍스트로 변환되어 소켓 정보를 인식 불가.  
- **원인**: Redis에 소켓을 직접 삽입하려 해 유저 객체 손실, 소켓 정보는 원복 불가.  
- **해결**: Queue에는 유저 ID만 추가하고, ID를 바탕으로 실제 유저 객체를 재조회하여 소켓 정보 복구.

### [3. 데드락에 죽다 살다](https://teamsparta.notion.site/9cf32dcb0d5644509cc1a302c173ab1e)
- **문제**: 멀티스레드 환경에서 락을 이용한 원자적 처리 구현 중, 이미 락을 잡은 상위 함수 내부에서 다시 같은 락을 획득하려 시도, 데드락 발생.  
- **원인**: 중첩된 락 획득으로 서로 대기 상태에 빠짐.  
- **해결**: 중복 락 제거 또는 락 획득 범위 최소화. 해당 함수 내 불필요한 락 제거로 정상 동작 확인.


## 기술적 도전 과제
### 모니터링 및 성능 관리
현재 **Prometheus와** **Grafana를** 통해 CPU, 메모리, 네트워크 트래픽, DB 상태 등의 **상위 레벨 자원 사용량**을 모니터링하고 있습니다.  
이러한 메트릭은 서버 상태를 개략적으로 파악하고 이상 징후를 조기 감지하는 데 도움을 줍니다.  
다만, 현재 단계에서는 특정 로직 블록이나 함수 단위로 세밀하게 부하가 집중되는 영역을 식별할 수준으로 계측하지 못하고 있습니다. 

이를 개선하기 위해 향후에는 코드 레벨에서
1. 특정 함수 호출 빈도 확인
2. 로직 경로의 부하 정도 확인
3. 특정 통신 경로에 대한 부하 확인

위의 목적들을 위해 커스텀 메트릭 삽입 등의 방법을 고려할 수 있을 것입니다.  
이를 통해 단순 자원 사용량 모니터링에서 나아가, 실제 비즈니스 로직 단위까지 부하 원인을 추적하고 성능 최적화에 반영할 계획입니다.  

### 모놀리식과 스케일링
현재 서버 아키텍처는 모놀리식(Monolithic) 구조로 되어 있어 서비스 확장 및 업데이트 시 일부 모듈 변경이 전체 시스템에 영향을 주는 한계가 있습니다.  
특히, 유저 수 증가나 특정 기능의 트래픽 급증 시 성능 병목이 발생하면, 전체 애플리케이션을 스케일링하거나 배포 단위를 쪼개기 어렵습니다.

이를 개선하는 방법으로 다음의 방법을 생각해볼 수 있습니다.  
- **마이크로서비스 아키텍처(MSA) 도입 검토**:  
  핵심 게임 로직(던전, PvP, 레이드 등)을 독립 서비스로 분리하여 각 서비스 단위로 배포 및 확장성을 확보하고자 합니다.  
  이를 통해 특정 기능에 부하가 몰릴 때 해당 부분만 수평 확장(Horizontal Scaling)을 수행할 수 있습니다.
  
- **비동기 메시지 큐 사용 확대**:  
  이벤트 기반 아키텍처를 강화하여 서비스 간 의존도를 낮추고, 확장성 있는 비동기 통신 패턴 도입으로 트래픽 급증 상황에 유연하게 대응하는 방법도 존재합니다.

위와 같은 기술적 도전 과제를 통해, 현재 모놀리식 구조의 한계를 극복하고 장기적으로는 유연한 확장성과 유지보수 용이성을 갖춘 분산 아키텍처를 구현하는 것을 계획하고 있습니다.

## 클라이언트 저장소
[Skill-Gacha-Client](https://github.com/Skill-Gacha/Skill-Gacha-Client)

## 상세 팀 문서

[팀 브로셔](https://teamsparta.notion.site/1342dc3ef51481a0aa2ad2d440f5dc50)

[팀 노션](https://teamsparta.notion.site/6337e0fd984d41999e28bd57065c6b36)


## 팀원 소개

| 이름 | 역할 | 블로그 주소 | GitHub 주소 |
|----------|----------|----------|----------|
| 이희원 | 팀장 | https://u-bvm.tistory.com | https://github.com/Ayumudayo |
| 진윤세 | 부팀장 | https://kagan-draca.tistory.com | https://github.com/JinYunSe |
| 이의현 | 팀원 | https://velog.io/@physeal_plate/posts | https://github.com/UIHyeonLEE |
| 윤여빈 | 팀원 | https://velog.io/@skc0103/posts | https://github.com/yoonyeobin |
| 이소영 | 팀원 | https://dadam2204.tistory.com/ | https://github.com/Dam2204 |
