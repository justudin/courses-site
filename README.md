# Courses-site

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

### Working with Docker container in development

- To build the Docker container for development, run

```
docker build --target development -t docs:dev .

```

- To run the Docker container in development, run

```
docker run -p 3000:3000 docs:dev

```

*Note:* Remember to stop the container before proceeding to the next step.


### Working with Docker container in production

- To build the Docker container for production, run


```
docker build -t docusaurus:latest .
```

- To run the Docker container in production, run


```
docker run --rm -p 3000:80 docusaurus:latest
```
