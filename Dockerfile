# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY * /app/

# Install the application dependencies
RUN npm install

# Build the Next.js application
RUN npm run build

# Expose the port on which the application will run
EXPOSE 3000

# Set the command to run the application
CMD ["npm", "start"]
