# Bench Chat: YouTube live chat overlay for OBS (benchpromos.com.br/livechat).
# bench-chat.js is a single dependency-free file. It saves its config and
# uploaded sounds next to itself, so it runs from the /data volume: each start
# copies the current version (plus an optional Lemon Milk font) there.
FROM node:22-alpine
RUN mkdir -p /data && chown node:node /data
COPY --chown=node:node . /opt/bench-chat/
USER node
WORKDIR /data
ENV PORTA=3500
EXPOSE 3500
CMD ["sh", "-c", "cp /opt/bench-chat/bench-chat.js /opt/bench-chat/*.otf /opt/bench-chat/*.ttf /data/ 2>/dev/null; exec node /data/bench-chat.js"]
