if [ -f /etc/nginx/conf.d/default.conf.template ]; then
    echo "Generating Nginx configuration from template..."
    envsubst '${VITE_BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
else
    echo "Template file /etc/nginx/conf.d/default.conf.template not found!"
    exit 1
fi

nginx -g "daemon off;"