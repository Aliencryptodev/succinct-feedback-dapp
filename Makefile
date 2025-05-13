# Makefile for Succinct Feedback DApp

start:
	docker-compose up --build

stop:
	docker-compose down

logs:
	docker-compose logs -f

restart:
	docker-compose down && docker-compose up --build

clean:
	docker-compose down -v --remove-orphans