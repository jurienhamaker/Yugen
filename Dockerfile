FROM golang:latest

WORKDIR /opt/app

RUN touch /usr/bin/prisma && \
	echo "go run github.com/steebchen/prisma-client-go" > /usr/bin/prisma && \
	chmod +x /usr/bin/prisma

RUN go install github.com/melkeydev/go-blueprint@latest && \
	go install github.com/air-verse/air@latest 

