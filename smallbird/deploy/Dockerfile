# CI build:dist job 이 만든 dist/ 를 nginx 로 서빙한다.
# 번들은 CI 의 pnpm 캐시를 그대로 쓰려고 이미지 밖에서 만든다. 그래서 환경 값 파일이 이미지 레이어에 남지 않는다.
FROM nginx:1.30.6-alpine

# 배포 후 이 앱의 옛 이미지만 정리하는 표시(deploy:stage 의 image prune --filter). 같은 서버의 다른 서비스 이미지는 건드리지 않는다.
LABEL kr.co.bigbird.app=client-fe

COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html

EXPOSE 80
