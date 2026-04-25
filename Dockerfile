FROM nginx:alpine
# Copy the static web app files to the nginx html directory
COPY . /usr/share/nginx/html
# Expose port 80
EXPOSE 80
# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
